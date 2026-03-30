using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using Moq;
using ThesisManagement.Api.Application.Command.DefensePeriods;
using ThesisManagement.Api.Application.Command.DefensePeriods.Services;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Common.Constraints;
using ThesisManagement.Api.Application.Common.Heuristics;
using ThesisManagement.Api.Application.Common.Resilience;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.DefensePeriods;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using Xunit;

namespace ThesisManagement.Api.Tests;

public class DefensePeriodEndToEndFlowTests
{
    [Fact]
    public async Task EndToEndFlow_ShouldRunSyncGenerateFinalizePublishRollbackSuccessfully()
    {
        await using var db = CreateDbContext();
        var uow = new UnitOfWork(db);

        SeedPeriodAndMasterData(db);

        var processor = BuildProcessor(db, uow);

        var syncResult = await processor.SyncAsync(1, new SyncDefensePeriodRequestDto { RetryOnFailure = true, IdempotencyKey = "sync-e2e" }, actorUserId: 1001);
        Assert.True(syncResult.Success);
        Assert.NotNull(syncResult.Data);
        Assert.NotEmpty(syncResult.Data!.SnapshotVersion);
        Assert.True(syncResult.Data.Readiness.ContainsKey("hasEligibleTopics"));

        var updateConfigResult = await processor.UpdateConfigAsync(1, new UpdateDefensePeriodConfigDto
        {
            Rooms = new List<string> { "R101" },
            MorningStart = "07:30",
            AfternoonStart = "13:30",
            SoftMaxCapacity = 4
        }, actorUserId: 1001);
        Assert.True(updateConfigResult.Success);

        var lockCapabilitiesResult = await processor.LockLecturerCapabilitiesAsync(1, actorUserId: 1001);
        Assert.True(lockCapabilitiesResult.Success);

        var confirmConfigResult = await processor.ConfirmCouncilConfigAsync(1, new ConfirmCouncilConfigDto
        {
            TopicsPerSessionConfig = 4,
            MembersPerCouncilConfig = 4,
            Tags = new List<string>()
        }, actorUserId: 1001);
        Assert.True(confirmConfigResult.Success);

        var generateResult = await processor.GenerateCouncilsAsync(1, new GenerateCouncilsRequestDto
        {
            SelectedRooms = new List<string> { "R101" },
            IdempotencyKey = "generate-e2e"
        }, actorUserId: 1001);

        Assert.True(generateResult.Success, generateResult.Message ?? "Generate failed");
        Assert.NotNull(generateResult.Data);
        Assert.NotEmpty(generateResult.Data!);

        await SeedScoresForPublishAsync(db);

        var finalizeResult = await processor.FinalizeAsync(1, new FinalizeDefensePeriodDto
        {
            AllowFinalizeAfterWarning = true,
            IdempotencyKey = "finalize-e2e"
        }, actorUserId: 1001);
        Assert.True(finalizeResult.Success, finalizeResult.Message ?? "Finalize failed");

        var publishResult = await processor.PublishScoresAsync(1, actorUserId: 1001, idempotencyKey: "publish-e2e");
        Assert.True(publishResult.Success, publishResult.Message ?? "Publish failed");

        var rollbackResult = await processor.RollbackAsync(1, new RollbackDefensePeriodDto
        {
            Target = "ALL",
            Reason = "E2E rollback validation",
            ForceUnlockScores = true,
            IdempotencyKey = "rollback-e2e"
        }, actorUserId: 1001);

        Assert.True(rollbackResult.Success, rollbackResult.Message ?? "Rollback failed");
        Assert.NotNull(rollbackResult.Data);
        Assert.False(rollbackResult.Data!.FinalizedAfter);
        Assert.False(rollbackResult.Data.ScoresPublishedAfter);

        var term = await db.DefenseTerms.AsNoTracking().FirstAsync(x => x.DefenseTermId == 1);
        Assert.Equal("Preparing", term.Status);
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"e2e-defense-{Guid.NewGuid()}")
            .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new ApplicationDbContext(options);
    }

    private static DefensePeriodCommandProcessor BuildProcessor(ApplicationDbContext db, IUnitOfWork uow)
    {
        var clients = new Mock<IHubClients>();
        var clientProxy = new Mock<IClientProxy>();
        clientProxy
            .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        clients.Setup(x => x.All).Returns(clientProxy.Object);

        var hub = new Mock<IHubContext<ChatHub>>();
        hub.Setup(x => x.Clients).Returns(clients.Object);

        var auditTrail = new Mock<IDefenseAuditTrailService>();
        auditTrail
            .Setup(x => x.WriteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<object?>(), It.IsAny<object?>(), It.IsAny<object?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var scoreWorkflow = new Mock<IDefenseScoreWorkflowService>();
        var revisionWorkflow = new Mock<IDefenseRevisionWorkflowService>();

        var rules = new ICommitteeConstraintRule[]
        {
            new RoleRequirementRule(db),
            new LecturerOverlapRule(db),
            new UniqueStudentAssignmentRule(db),
            new SupervisorConflictRule(db)
        };

        var constraintService = new CommitteeConstraintService(rules);
        var heuristicService = new DefenseCommitteeHeuristicService(
            Options.Create(new DefenseAutoGenerateHeuristicOptions()));
        var resiliencePolicy = new DefenseResiliencePolicy(
            Options.Create(new DefenseResiliencePolicyOptions
            {
                MaxRetries = 0,
                BaseDelayMs = 1,
                OperationTimeoutMs = 5000,
                CircuitFailureThreshold = 10,
                CircuitBreakSeconds = 5
            }));

        return new DefensePeriodCommandProcessor(
            db,
            uow,
            hub.Object,
            constraintService,
            heuristicService,
            scoreWorkflow.Object,
            revisionWorkflow.Object,
            auditTrail.Object,
            resiliencePolicy);
    }

    private static void SeedPeriodAndMasterData(ApplicationDbContext db)
    {
        db.DefenseTerms.Add(new DefenseTerm
        {
            DefenseTermId = 1,
            Name = "Term 1",
            StartDate = DateTime.UtcNow.Date,
            Status = "Preparing",
            CreatedAt = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            ConfigJson = "{}"
        });

        db.LecturerProfiles.AddRange(
            new LecturerProfile { LecturerProfileID = 1, LecturerCode = "L001", FullName = "Lec 1" },
            new LecturerProfile { LecturerProfileID = 2, LecturerCode = "L002", FullName = "Lec 2" },
            new LecturerProfile { LecturerProfileID = 3, LecturerCode = "L003", FullName = "Lec 3" },
            new LecturerProfile { LecturerProfileID = 4, LecturerCode = "L004", FullName = "Lec 4" });

        db.Topics.AddRange(
            new Topic { TopicID = 1, TopicCode = "T001", Title = "Topic 1", Type = "Research", ProposerUserID = 1, ProposerStudentCode = "S001", SupervisorLecturerCode = "SUP001", Status = "Eligible" },
            new Topic { TopicID = 2, TopicCode = "T002", Title = "Topic 2", Type = "Research", ProposerUserID = 2, ProposerStudentCode = "S002", SupervisorLecturerCode = "SUP002", Status = "Eligible" },
            new Topic { TopicID = 3, TopicCode = "T003", Title = "Topic 3", Type = "Research", ProposerUserID = 3, ProposerStudentCode = "S003", SupervisorLecturerCode = "SUP003", Status = "Eligible" },
            new Topic { TopicID = 4, TopicCode = "T004", Title = "Topic 4", Type = "Research", ProposerUserID = 4, ProposerStudentCode = "S004", SupervisorLecturerCode = "SUP004", Status = "Eligible" },
            new Topic { TopicID = 5, TopicCode = "T005", Title = "Topic 5", Type = "Research", ProposerUserID = 5, ProposerStudentCode = "S005", SupervisorLecturerCode = "SUP005", Status = "Eligible" },
            new Topic { TopicID = 6, TopicCode = "T006", Title = "Topic 6", Type = "Research", ProposerUserID = 6, ProposerStudentCode = "S006", SupervisorLecturerCode = "SUP006", Status = "Eligible" },
            new Topic { TopicID = 7, TopicCode = "T007", Title = "Topic 7", Type = "Research", ProposerUserID = 7, ProposerStudentCode = "S007", SupervisorLecturerCode = "SUP007", Status = "Eligible" },
            new Topic { TopicID = 8, TopicCode = "T008", Title = "Topic 8", Type = "Research", ProposerUserID = 8, ProposerStudentCode = "S008", SupervisorLecturerCode = "SUP008", Status = "Eligible" });

        db.ProgressMilestones.AddRange(
            new ProgressMilestone { MilestoneID = 1, MilestoneCode = "MS-1", TopicID = 1, TopicCode = "T001", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 2, MilestoneCode = "MS-2", TopicID = 2, TopicCode = "T002", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 3, MilestoneCode = "MS-3", TopicID = 3, TopicCode = "T003", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 4, MilestoneCode = "MS-4", TopicID = 4, TopicCode = "T004", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 5, MilestoneCode = "MS-5", TopicID = 5, TopicCode = "T005", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 6, MilestoneCode = "MS-6", TopicID = 6, TopicCode = "T006", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 7, MilestoneCode = "MS-7", TopicID = 7, TopicCode = "T007", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow },
            new ProgressMilestone { MilestoneID = 8, MilestoneCode = "MS-8", TopicID = 8, TopicCode = "T008", MilestoneTemplateCode = "MS_PROG1", State = "Eligible", CreatedAt = DateTime.UtcNow, LastUpdated = DateTime.UtcNow });

        db.SaveChanges();
    }

    private static async Task SeedScoresForPublishAsync(ApplicationDbContext db)
    {
        var now = DateTime.UtcNow;
        var assignments = await db.DefenseAssignments.AsNoTracking().ToListAsync();
        var members = await db.CommitteeMembers.AsNoTracking().ToListAsync();

        foreach (var assignment in assignments)
        {
            var committeeMembers = members.Where(x => x.CommitteeID == assignment.CommitteeID).ToList();

            foreach (var member in committeeMembers.Where(x => x.Role == "CT" || x.Role == "TK" || x.Role == "PB"))
            {
                db.DefenseScores.Add(new DefenseScore
                {
                    ScoreCode = $"SC-{assignment.AssignmentID}-{member.Role}",
                    AssignmentID = assignment.AssignmentID,
                    AssignmentCode = assignment.AssignmentCode,
                    MemberLecturerCode = member.MemberLecturerCode,
                    MemberLecturerProfileID = member.MemberLecturerProfileID,
                    MemberLecturerUserID = member.MemberUserID,
                    MemberLecturerUserCode = member.MemberUserCode,
                    Role = member.Role,
                    Score = 7.5m,
                    IsSubmitted = true,
                    CreatedAt = now,
                    LastUpdated = now
                });
            }

            db.DefenseResults.Add(new DefenseResult
            {
                AssignmentId = assignment.AssignmentID,
                ScoreGvhd = 7.0m,
                IsLocked = false,
                CreatedAt = now,
                LastUpdated = now
            });
        }

        await db.SaveChangesAsync();
    }
}

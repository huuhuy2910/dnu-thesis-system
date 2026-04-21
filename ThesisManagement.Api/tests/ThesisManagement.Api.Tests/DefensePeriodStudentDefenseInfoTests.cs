using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Query.DefensePeriods;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.Models;
using Xunit;

namespace ThesisManagement.Api.Tests;

public class DefensePeriodStudentDefenseInfoTests
{
    [Fact]
    public async Task GetStudentDefenseInfoAsync_ShouldReturnTopicWhenAssignmentIsMissing()
    {
        await using var db = CreateDbContext();
        SeedStudentTopicOnlyScenario(db);

        var processor = new DefensePeriodQueryProcessor(db);

        var result = await processor.GetStudentDefenseInfoAsync("S001", 1);

        result.Success.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200);
        result.Data.Should().NotBeNull();
        result.Data!.StudentCode.Should().Be("S001");
        result.Data.StudentName.Should().Be("Nguyen Van A");
        result.Data.TopicCode.Should().Be("T001");
        result.Data.TopicTitle.Should().Be("Topic 1");
        result.Data.CommitteeCode.Should().BeNull();
        result.Data.Room.Should().BeNull();
        result.Data.ScheduledAt.Should().BeNull();
        result.Data.Session.Should().BeNull();
        result.Data.SessionCode.Should().BeNull();
        result.Data.CouncilListLocked.Should().BeTrue();
        result.Data.CouncilLockStatus.Should().Be("LOCKED");
        result.Warnings.Should().ContainSingle(x => x.Code == "DEFENSE_INFO_ASSIGNMENT_PENDING");
    }

    [Fact]
    public async Task GetStudentDefenseInfoAsync_ShouldResolveStudentByUserCodeCaseInsensitive()
    {
        await using var db = CreateDbContext();
        SeedStudentTopicOnlyScenario(db);

        var processor = new DefensePeriodQueryProcessor(db);

        var result = await processor.GetStudentDefenseInfoAsync("sv01", 1);

        result.Success.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200);
        result.Data.Should().NotBeNull();
        result.Data!.StudentCode.Should().Be("S001");
        result.Data.StudentName.Should().Be("Nguyen Van A");
        result.Data.TopicCode.Should().Be("T001");
    }

    [Fact]
    public async Task GetStudentDefenseInfoAsync_ShouldApplySessionStartTimeFromConfigWhenTimeMissing()
    {
        await using var db = CreateDbContext();
        SeedStudentScheduledScenarioWithSessionFallback(db);

        var processor = new DefensePeriodQueryProcessor(db);

        var result = await processor.GetStudentDefenseInfoAsync("S002", 1);

        result.Success.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200);
        result.Data.Should().NotBeNull();
        result.Data!.ScheduledAt.Should().Be(new DateTime(2026, 04, 24, 13, 45, 0));
        result.Data.SessionCode.Should().Be("AFTERNOON");
        result.Data.CommitteeCode.Should().Be("HD-2026-0001");
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"student-defense-info-tests-{Guid.NewGuid()}")
            .Options;

        return new ApplicationDbContext(options);
    }

    private static void SeedStudentTopicOnlyScenario(ApplicationDbContext db)
    {
        var now = DateTime.UtcNow;

        db.DefenseTerms.Add(new DefenseTerm
        {
            DefenseTermId = 1,
            Name = "Term 1",
            StartDate = DateTime.UtcNow.Date,
            Status = "Preparing",
            CreatedAt = now,
            LastUpdated = now,
            ConfigJson = "{\"CouncilListLocked\":true}"
        });

        db.StudentProfiles.Add(new StudentProfile
        {
            StudentProfileID = 1,
            StudentCode = "S001",
            UserID = 1,
            UserCode = "SV01",
            FullName = "Nguyen Van A"
        });

        db.Topics.Add(new Topic
        {
            TopicID = 1,
            TopicCode = "T001",
            Title = "Topic 1",
            Type = "Research",
            ProposerUserID = 1,
            ProposerStudentCode = "S001",
            DefenseTermId = 1,
            Status = "Eligible",
            CreatedAt = now,
            LastUpdated = now
        });

        db.SaveChanges();
    }

    private static void SeedStudentScheduledScenarioWithSessionFallback(ApplicationDbContext db)
    {
        var now = DateTime.UtcNow;

        db.DefenseTerms.Add(new DefenseTerm
        {
            DefenseTermId = 1,
            Name = "Term 1",
            StartDate = DateTime.UtcNow.Date,
            Status = "Preparing",
            CreatedAt = now,
            LastUpdated = now,
            ConfigJson = "{\"CouncilListLocked\":true,\"MorningStart\":\"07:30\",\"AfternoonStart\":\"13:45\",\"CouncilIds\":[100]}"
        });

        db.StudentProfiles.Add(new StudentProfile
        {
            StudentProfileID = 2,
            StudentCode = "S002",
            UserID = 2,
            UserCode = "SV02",
            FullName = "Nguyen Van B"
        });

        db.Topics.Add(new Topic
        {
            TopicID = 2,
            TopicCode = "T002",
            Title = "Topic 2",
            Type = "Research",
            ProposerUserID = 2,
            ProposerStudentCode = "S002",
            DefenseTermId = 1,
            Status = "Eligible",
            CreatedAt = now,
            LastUpdated = now
        });

        db.Committees.Add(new Committee
        {
            CommitteeID = 100,
            CommitteeCode = "HD-2026-0001",
            Name = "Hoi dong 1",
            DefenseTermId = 1,
            DefenseDate = new DateTime(2026, 04, 24),
            Room = "A101",
            Status = "Ready",
            CreatedAt = now,
            LastUpdated = now
        });

        db.DefenseAssignments.Add(new DefenseAssignment
        {
            AssignmentID = 10,
            AssignmentCode = "ASG-0001",
            TopicCode = "T002",
            CommitteeID = 100,
            CommitteeCode = "HD-2026-0001",
            DefenseTermId = 1,
            ScheduledAt = new DateTime(2026, 04, 24),
            Session = 2,
            StartTime = null,
            OrderIndex = 1,
            Status = "Assigned",
            CreatedAt = now,
            LastUpdated = now
        });

        db.SaveChanges();
    }
}

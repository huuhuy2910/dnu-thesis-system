using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Query.Topics;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.DTOs.Workflows.Command;
using ThesisManagement.Api.DTOs.Workflows.Query;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.Chat;

namespace ThesisManagement.Api.Application.Command.Workflows
{
    public interface IDecideTopicWorkflowCommandProcessor
    {
        Task<OperationResult<TopicWorkflowResultDto>> DecideAsync(int topicId, TopicDecisionWorkflowRequestDto request);
    }

    public class DecideTopicWorkflowCommandProcessor : IDecideTopicWorkflowCommandProcessor
    {
        private readonly ApplicationDbContext _db;
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IChatProvisionService _chatProvisionService;
        private readonly ITopicWorkflowCommandSupport _support;

        public DecideTopicWorkflowCommandProcessor(
            ApplicationDbContext db,
            IUnitOfWork uow,
            IMapper mapper,
            ICurrentUserService currentUserService,
            IChatProvisionService chatProvisionService,
            ITopicWorkflowCommandSupport support)
        {
            _db = db;
            _uow = uow;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _chatProvisionService = chatProvisionService;
            _support = support;
        }

        public async Task<OperationResult<TopicWorkflowResultDto>> DecideAsync(int topicId, TopicDecisionWorkflowRequestDto request)
        {
            if (topicId <= 0)
                return OperationResult<TopicWorkflowResultDto>.Failed("Invalid topic id", 400);

            if (string.IsNullOrWhiteSpace(request.Action))
                return OperationResult<TopicWorkflowResultDto>.Failed("Action is required", 400);

            var topic = await _uow.Topics.GetByIdAsync(topicId);
            if (topic == null)
                return OperationResult<TopicWorkflowResultDto>.Failed("Topic not found", 404);

            var correlationId = Guid.NewGuid().ToString("N");
            var requestJson = _support.ToJson(request);
            var beforeStatus = topic.Status;
            var beforeResubmitCount = topic.ResubmitCount;
            var beforeTags = await _uow.TopicTags.Query()
                .Where(x => x.TopicCode == topic.TopicCode)
                .Select(x => x.TagCode ?? string.Empty)
                .Where(x => x != string.Empty)
                .Distinct()
                .ToListAsync();
            var beforeMilestoneState = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topic.TopicID)
                .OrderByDescending(x => x.MilestoneID)
                .Select(x => x.State)
                .FirstOrDefaultAsync();

            var actorUserCode = _currentUserService.GetUserCode();
            var actorRole = _currentUserService.GetUserRole();
            var privileged = _support.IsPrivilegedRole(actorRole);
            var isSupervisor = !string.IsNullOrWhiteSpace(actorUserCode)
                               && string.Equals(topic.SupervisorUserCode, actorUserCode, StringComparison.OrdinalIgnoreCase);
            if (!privileged && !isSupervisor)
                return OperationResult<TopicWorkflowResultDto>.Failed("Forbidden", 403);

            var action = request.Action.Trim().ToLowerInvariant();
            if ((action == "reject" || action == "revision") && string.IsNullOrWhiteSpace(request.Comment))
                return OperationResult<TopicWorkflowResultDto>.Failed("Comment is required for reject/revision", 400);

            topic.Status = action switch
            {
                "approve" => "Đã duyệt",
                "reject" => "Từ chối",
                "revision" => "Cần sửa đổi",
                _ => topic.Status
            };

            if (action != "approve" && action != "reject" && action != "revision")
                return OperationResult<TopicWorkflowResultDto>.Failed("Unsupported decision action", 400);

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                topic.LecturerComment = request.Comment;
                topic.LastUpdated = DateTime.UtcNow;
                _uow.Topics.Update(topic);

                if (action == "approve")
                {
                    await _support.EnsurePrimaryTopicLecturerLinkAsync(topic);
                    await _chatProvisionService.EnsureForAcceptedTopicAsync(topic);
                }

                var milestoneState = await _support.SyncMilestoneForDecisionAsync(topic, action);
                await _uow.SaveChangesAsync();

                var mappedTopic = _mapper.Map<TopicReadDto>(topic);
                var tagCodes = await _uow.TopicTags.Query()
                    .Where(x => x.TopicCode == topic.TopicCode)
                    .Select(x => x.TagCode ?? string.Empty)
                    .Where(x => x != string.Empty)
                    .Distinct()
                    .ToListAsync();

                var response = new TopicWorkflowResultDto(
                    mappedTopic,
                    tagCodes,
                    milestoneState,
                    _support.NormalizeStatusCode(topic.Status),
                    false,
                    "Đã cập nhật quyết định duyệt đề tài");

                await _support.CreateWorkflowAuditAsync(
                    actionType: "DECISION",
                    decisionAction: request.Action,
                    topic: topic,
                    oldStatus: beforeStatus,
                    newStatus: topic.Status,
                    statusCode: response.StatusCode,
                    resubmitCountBefore: beforeResubmitCount,
                    resubmitCountAfter: topic.ResubmitCount,
                    commentText: request.Comment,
                    isSuccess: true,
                    errorMessage: null,
                    requestPayload: requestJson,
                    responsePayload: _support.ToJson(response),
                    tagsBefore: _support.ToJson(beforeTags),
                    tagsAfter: _support.ToJson(tagCodes),
                    milestoneBefore: _support.ToJson(new { State = beforeMilestoneState }),
                    milestoneAfter: _support.ToJson(new { State = milestoneState }),
                    correlationId: correlationId,
                    requestId: correlationId,
                    idempotencyKey: null,
                    reviewerUserCode: _currentUserService.GetUserCode());

                await tx.CommitAsync();

                return OperationResult<TopicWorkflowResultDto>.Succeeded(response);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();

                await _support.TryCreateFailureAuditAsync(
                    actionType: "DECISION",
                    decisionAction: request.Action,
                    topic: topic,
                    oldStatus: beforeStatus,
                    newStatus: topic.Status,
                    statusCode: _support.NormalizeStatusCode(topic.Status),
                    resubmitCountBefore: beforeResubmitCount,
                    resubmitCountAfter: topic.ResubmitCount,
                    commentText: request.Comment,
                    errorMessage: ex.Message,
                    requestPayload: requestJson,
                    responsePayload: null,
                    tagsBefore: _support.ToJson(beforeTags),
                    tagsAfter: null,
                    milestoneBefore: _support.ToJson(new { State = beforeMilestoneState }),
                    milestoneAfter: null,
                    correlationId: correlationId,
                    requestId: correlationId,
                    idempotencyKey: null,
                    reviewerUserCode: _currentUserService.GetUserCode());

                return OperationResult<TopicWorkflowResultDto>.Failed("Decision workflow failed", 500);
            }
        }
    }
}

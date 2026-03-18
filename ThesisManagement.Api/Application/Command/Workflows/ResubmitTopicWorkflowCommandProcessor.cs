using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Oracle.ManagedDataAccess.Client;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Query.Topics;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.DTOs.Workflows.Command;
using ThesisManagement.Api.DTOs.Workflows.Query;
using ThesisManagement.Api.Application.Command.Notifications;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Workflows
{
    public interface IResubmitTopicWorkflowCommandProcessor
    {
        Task<OperationResult<TopicWorkflowResultDto>> SubmitAsync(TopicResubmitWorkflowRequestDto request);
        Task<OperationResult<TopicWorkflowResultDto>> ResubmitAsync(TopicResubmitWorkflowRequestDto request);
    }

    public class ResubmitTopicWorkflowCommandProcessor : IResubmitTopicWorkflowCommandProcessor
    {
        private readonly ApplicationDbContext _db;
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly ITopicCodeGenerator _topicCodeGenerator;
        private readonly ITopicWorkflowCommandSupport _support;
        private readonly INotificationEventPublisher _notificationEventPublisher;

        public ResubmitTopicWorkflowCommandProcessor(
            ApplicationDbContext db,
            IUnitOfWork uow,
            IMapper mapper,
            ICurrentUserService currentUserService,
            ITopicCodeGenerator topicCodeGenerator,
            ITopicWorkflowCommandSupport support,
            INotificationEventPublisher notificationEventPublisher)
        {
            _db = db;
            _uow = uow;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _topicCodeGenerator = topicCodeGenerator;
            _support = support;
            _notificationEventPublisher = notificationEventPublisher;
        }

        public Task<OperationResult<TopicWorkflowResultDto>> SubmitAsync(TopicResubmitWorkflowRequestDto request)
        {
            var submitRequest = request with
            {
                TopicID = null,
                TopicCode = null,
                ForceCreateNewTopic = true
            };

            return ResubmitAsync(submitRequest);
        }

        public async Task<OperationResult<TopicWorkflowResultDto>> ResubmitAsync(TopicResubmitWorkflowRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return OperationResult<TopicWorkflowResultDto>.Failed("Title is required", 400);

            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<TopicWorkflowResultDto>.Failed("Unauthorized", 401);

            var actorUser = await _uow.Users.GetByCodeAsync(actorUserCode);
            if (actorUser == null)
                return OperationResult<TopicWorkflowResultDto>.Failed("User not found", 404);

            var actorRole = _currentUserService.GetUserRole();
            var privileged = _support.IsPrivilegedRole(actorRole);

            var existingTopic = await _support.ResolveTopicAsync(request.TopicID, request.TopicCode);
            var forceCreate = request.ForceCreateNewTopic == true;
            var correlationId = Guid.NewGuid().ToString("N");
            var requestJson = _support.ToJson(request);

            var beforeStatus = existingTopic?.Status;
            var beforeResubmitCount = existingTopic?.ResubmitCount;
            var beforeTags = existingTopic == null
                ? new List<string>()
                : await _uow.TopicTags.Query()
                    .Where(x => x.TopicCode == existingTopic.TopicCode)
                    .Select(x => x.TagCode ?? string.Empty)
                    .Where(x => x != string.Empty)
                    .Distinct()
                    .ToListAsync();
            var beforeMilestoneState = existingTopic == null
                ? null
                : await _uow.ProgressMilestones.Query()
                    .Where(x => x.TopicID == existingTopic.TopicID)
                    .OrderByDescending(x => x.MilestoneID)
                    .Select(x => x.State)
                    .FirstOrDefaultAsync();

            if (existingTopic != null && !forceCreate)
            {
                var isOwner = string.Equals(existingTopic.ProposerUserCode, actorUserCode, StringComparison.OrdinalIgnoreCase);
                if (!isOwner && !privileged)
                    return OperationResult<TopicWorkflowResultDto>.Failed("Forbidden", 403);

                if (_support.IsAcceptedStatus(existingTopic.Status))
                    return OperationResult<TopicWorkflowResultDto>.Failed("Approved topic cannot be overwritten. Use ForceCreateNewTopic", 400);
            }

            var isNewTopic = existingTopic == null || forceCreate;

            var topic = isNewTopic ? new Topic() : existingTopic!;

            if (isNewTopic && !string.Equals(request.Type, "SELF", StringComparison.OrdinalIgnoreCase))
            {
                var catalogCode = request.CatalogTopicCode?.Trim();
                if (!string.IsNullOrWhiteSpace(catalogCode))
                {
                    var catalogCodeUsed = await _uow.Topics.Query()
                        .AnyAsync(x => x.CatalogTopicCode == catalogCode);
                    if (catalogCodeUsed)
                        return OperationResult<TopicWorkflowResultDto>.Failed("Catalog topic already has a registered topic. Please use resubmit for the existing topic.", 409);
                }

                if (request.CatalogTopicID.HasValue)
                {
                    var catalogIdUsed = await _uow.Topics.Query()
                        .AnyAsync(x => x.CatalogTopicID == request.CatalogTopicID.Value);
                    if (catalogIdUsed)
                        return OperationResult<TopicWorkflowResultDto>.Failed("Catalog topic already has a registered topic. Please use resubmit for the existing topic.", 409);
                }
            }

            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                topic.TopicCode = isNewTopic
                    ? (string.IsNullOrWhiteSpace(request.TopicCode) ? await _topicCodeGenerator.GenerateAsync() : request.TopicCode)
                    : topic.TopicCode;
                topic.Title = request.Title.Trim();
                topic.Summary = request.Summary;
                topic.Type = string.IsNullOrWhiteSpace(request.Type) ? "SELF" : request.Type.Trim().ToUpperInvariant();

                topic.ProposerUserID = request.ProposerUserID ?? actorUser.UserID;
                topic.ProposerUserCode = string.IsNullOrWhiteSpace(request.ProposerUserCode) ? actorUser.UserCode : request.ProposerUserCode;
                topic.ProposerStudentProfileID = request.ProposerStudentProfileID ?? topic.ProposerStudentProfileID;
                topic.ProposerStudentCode = request.ProposerStudentCode ?? topic.ProposerStudentCode;

                topic.SupervisorUserID = request.SupervisorUserID;
                topic.SupervisorUserCode = request.SupervisorUserCode;
                topic.SupervisorLecturerProfileID = request.SupervisorLecturerProfileID;
                topic.SupervisorLecturerCode = request.SupervisorLecturerCode;

                topic.DepartmentID = request.DepartmentID;
                topic.DepartmentCode = request.DepartmentCode;

                if (string.Equals(topic.Type, "SELF", StringComparison.OrdinalIgnoreCase))
                {
                    topic.CatalogTopicID = null;
                    topic.CatalogTopicCode = null;
                }
                else
                {
                    topic.CatalogTopicID = request.CatalogTopicID;
                    topic.CatalogTopicCode = request.CatalogTopicCode;
                }

                topic.Status = "Đang chờ";
                topic.LecturerComment = request.StudentNote;
                topic.ResubmitCount = (topic.ResubmitCount ?? 0) + 1;
                topic.LastUpdated = DateTime.UtcNow;
                if (isNewTopic)
                    topic.CreatedAt = DateTime.UtcNow;

                if (isNewTopic)
                    await _uow.Topics.AddAsync(topic);
                else
                    _uow.Topics.Update(topic);

                await _uow.SaveChangesAsync();

                if (isNewTopic && !string.Equals(topic.Type, "SELF", StringComparison.OrdinalIgnoreCase))
                {
                    CatalogTopic? catalogTopic = null;

                    if (!string.IsNullOrWhiteSpace(topic.CatalogTopicCode))
                    {
                        catalogTopic = await _uow.CatalogTopics.Query()
                            .FirstOrDefaultAsync(x => x.CatalogTopicCode == topic.CatalogTopicCode);
                    }

                    if (catalogTopic == null && topic.CatalogTopicID.HasValue)
                    {
                        catalogTopic = await _uow.CatalogTopics.GetByIdAsync(topic.CatalogTopicID.Value);
                    }

                    if (catalogTopic != null)
                    {
                        catalogTopic.AssignedStatus = "Đã giao";
                        catalogTopic.AssignedAt = DateTime.UtcNow;
                        catalogTopic.LastUpdated = DateTime.UtcNow;
                        _uow.CatalogTopics.Update(catalogTopic);
                        await _uow.SaveChangesAsync();
                    }
                }

                await _support.SyncTopicTagsAsync(topic, request.TagIDs, request.TagCodes, request.UseCatalogTopicTags == true);
                var milestoneState = await _support.SyncMilestoneForResubmitAsync(topic, isNewTopic);

                var mappedTopic = _mapper.Map<TopicReadDto>(topic);
                var updatedTagCodes = await _uow.TopicTags.Query()
                    .Where(x => x.TopicCode == topic.TopicCode)
                    .Select(x => x.TagCode ?? string.Empty)
                    .Where(x => x != string.Empty)
                    .Distinct()
                    .ToListAsync();

                await tx.CommitAsync();

                var result = new TopicWorkflowResultDto(
                    mappedTopic,
                    updatedTagCodes,
                    milestoneState,
                    _support.NormalizeStatusCode(topic.Status),
                    isNewTopic,
                    isNewTopic
                        ? "Đề tài đã được tạo và gửi duyệt"
                        : "Đề tài đã được cập nhật và gửi duyệt lại");

                await _support.CreateWorkflowAuditAsync(
                    actionType: isNewTopic ? "SUBMIT" : "RESUBMIT",
                    decisionAction: null,
                    topic: topic,
                    oldStatus: beforeStatus,
                    newStatus: topic.Status,
                    statusCode: result.StatusCode,
                    resubmitCountBefore: beforeResubmitCount,
                    resubmitCountAfter: topic.ResubmitCount,
                    commentText: request.StudentNote,
                    isSuccess: true,
                    errorMessage: null,
                    requestPayload: requestJson,
                    responsePayload: _support.ToJson(result),
                    tagsBefore: _support.ToJson(beforeTags),
                    tagsAfter: _support.ToJson(updatedTagCodes),
                    milestoneBefore: _support.ToJson(new { State = beforeMilestoneState }),
                    milestoneAfter: _support.ToJson(new { State = milestoneState }),
                    correlationId: correlationId,
                    requestId: correlationId,
                    idempotencyKey: null,
                    reviewerUserCode: topic.SupervisorUserCode);

                if (!string.IsNullOrWhiteSpace(topic.SupervisorUserCode)
                    && !string.Equals(topic.SupervisorUserCode, actorUserCode, StringComparison.OrdinalIgnoreCase))
                {
                    var title = isNewTopic ? "Có đề tài mới chờ duyệt" : "Có đề tài gửi duyệt lại";
                    var body = isNewTopic
                        ? $"Đề tài {topic.TopicCode} - {topic.Title} vừa được gửi để duyệt. Người gửi: {actorUserCode}. Vui lòng vào màn hình duyệt để xem chi tiết nội dung và xử lý."
                        : $"Đề tài {topic.TopicCode} - {topic.Title} vừa được sinh viên gửi duyệt lại. Người gửi: {actorUserCode}. Vui lòng kiểm tra cập nhật mới và phản hồi sớm.";

                    await _notificationEventPublisher.PublishAsync(new NotificationEventRequest(
                        NotifCategory: "TOPIC_WORKFLOW",
                        NotifTitle: title,
                        NotifBody: body,
                        NotifPriority: "NORMAL",
                        ActionType: "OPEN_TOPIC",
                        ActionUrl: $"/topics/workflow/{topic.TopicCode}",
                        RelatedEntityName: "TOPIC",
                        RelatedEntityCode: topic.TopicCode,
                        RelatedEntityID: topic.TopicID,
                        IsGlobal: false,
                        TargetUserCodes: new List<string> { topic.SupervisorUserCode }));
                }

                return OperationResult<TopicWorkflowResultDto>.Succeeded(result, isNewTopic ? 201 : 200);
            }
            catch (DbUpdateException ex) when (IsCatalogTopicUniqueViolation(ex))
            {
                await tx.RollbackAsync();

                await _support.TryCreateFailureAuditAsync(
                    actionType: existingTopic == null || forceCreate ? "SUBMIT" : "RESUBMIT",
                    decisionAction: null,
                    topic: existingTopic,
                    oldStatus: beforeStatus,
                    newStatus: existingTopic?.Status,
                    statusCode: _support.NormalizeStatusCode(existingTopic?.Status),
                    resubmitCountBefore: beforeResubmitCount,
                    resubmitCountAfter: existingTopic?.ResubmitCount,
                    commentText: request.StudentNote,
                    errorMessage: "Catalog topic unique constraint violation",
                    requestPayload: requestJson,
                    responsePayload: null,
                    tagsBefore: _support.ToJson(beforeTags),
                    tagsAfter: null,
                    milestoneBefore: _support.ToJson(new { State = beforeMilestoneState }),
                    milestoneAfter: null,
                    correlationId: correlationId,
                    requestId: correlationId,
                    idempotencyKey: null,
                    reviewerUserCode: existingTopic?.SupervisorUserCode);

                return OperationResult<TopicWorkflowResultDto>.Failed("Catalog topic already has a registered topic. Please use resubmit for the existing topic.", 409);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();

                await _support.TryCreateFailureAuditAsync(
                    actionType: existingTopic == null || forceCreate ? "SUBMIT" : "RESUBMIT",
                    decisionAction: null,
                    topic: existingTopic,
                    oldStatus: beforeStatus,
                    newStatus: existingTopic?.Status,
                    statusCode: _support.NormalizeStatusCode(existingTopic?.Status),
                    resubmitCountBefore: beforeResubmitCount,
                    resubmitCountAfter: existingTopic?.ResubmitCount,
                    commentText: request.StudentNote,
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
                    reviewerUserCode: existingTopic?.SupervisorUserCode);

                return OperationResult<TopicWorkflowResultDto>.Failed("Resubmit workflow failed", 500);
            }
        }

        private static bool IsCatalogTopicUniqueViolation(DbUpdateException ex)
        {
            var oraEx = ex.InnerException as OracleException;
            if (oraEx == null)
                return false;

            return oraEx.Number == 1
                && (oraEx.Message?.Contains("UQ_TOPICS_CATALOGTOPICCODE_UQ", StringComparison.OrdinalIgnoreCase) ?? false);
        }
    }
}

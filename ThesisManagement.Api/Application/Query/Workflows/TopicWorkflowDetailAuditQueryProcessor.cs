using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.DTOs.Workflows.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Workflows
{
    public interface ITopicWorkflowDetailAuditQueryProcessor
    {
        Task<OperationResult<TopicWorkflowDetailDto>> GetDetailAsync(int topicId);
        Task<OperationResult<TopicWorkflowAuditListDto>> GetAuditHistoryAsync(TopicWorkflowAuditFilter filter);
    }

    public class TopicWorkflowDetailAuditQueryProcessor : ITopicWorkflowDetailAuditQueryProcessor
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public TopicWorkflowDetailAuditQueryProcessor(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TopicWorkflowDetailDto>> GetDetailAsync(int topicId)
        {
            if (topicId <= 0)
                return OperationResult<TopicWorkflowDetailDto>.Failed("Invalid topic id", 400);

            var topic = await _uow.Topics.GetByIdAsync(topicId);
            if (topic == null)
                return OperationResult<TopicWorkflowDetailDto>.Failed("Topic not found", 404);

            var tagCodes = await _uow.TopicTags.Query()
                .Where(x => x.TopicCode == topic.TopicCode)
                .Select(x => x.TagCode ?? string.Empty)
                .Where(x => x != string.Empty)
                .Distinct()
                .ToListAsync();

            var latestMilestone = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topic.TopicID)
                .OrderByDescending(x => x.MilestoneID)
                .FirstOrDefaultAsync();

            var dto = new TopicWorkflowDetailDto(
                _mapper.Map<TopicReadDto>(topic),
                tagCodes,
                latestMilestone?.State,
                latestMilestone?.MilestoneTemplateCode,
                latestMilestone?.Ordinal,
                latestMilestone?.CompletedAt1,
                latestMilestone?.CompletedAt2,
                latestMilestone?.CompletedAt3,
                latestMilestone?.CompletedAt4,
                latestMilestone?.CompletedAt5,
                topic.ResubmitCount ?? 0,
                topic.LecturerComment);

            return OperationResult<TopicWorkflowDetailDto>.Succeeded(dto);
        }

        public async Task<OperationResult<TopicWorkflowAuditListDto>> GetAuditHistoryAsync(TopicWorkflowAuditFilter filter)
        {
            var query = _uow.TopicWorkflowAudits.Query();

            if (filter.TopicID.HasValue)
                query = query.Where(x => x.TopicID == filter.TopicID.Value);
            if (!string.IsNullOrWhiteSpace(filter.TopicCode))
                query = query.Where(x => x.TopicCode == filter.TopicCode);
            if (!string.IsNullOrWhiteSpace(filter.ActionType))
                query = query.Where(x => x.ActionType == filter.ActionType);
            if (!string.IsNullOrWhiteSpace(filter.StatusCode))
                query = query.Where(x => x.StatusCode == filter.StatusCode);
            if (filter.IsSuccess.HasValue)
                query = query.Where(x => x.IsSuccess == filter.IsSuccess.Value);
            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var keyword = filter.Search.Trim();
                query = query.Where(x =>
                    (x.TopicCode ?? "").Contains(keyword) ||
                    (x.ActionType ?? "").Contains(keyword) ||
                    (x.DecisionAction ?? "").Contains(keyword) ||
                    (x.ActorUserCode ?? "").Contains(keyword) ||
                    (x.CorrelationID ?? "").Contains(keyword));
            }

            query = query.OrderByDescending(x => x.CreatedAt);
            var totalCount = await query.CountAsync();
            var entities = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var items = entities.Select(x => new TopicWorkflowAuditReadDto(
                x.AuditID,
                x.AuditCode,
                x.ActionType,
                x.DecisionAction,
                x.TopicID,
                x.TopicCode,
                x.OldStatus,
                x.NewStatus,
                x.StatusCode,
                x.ResubmitCountBefore,
                x.ResubmitCountAfter,
                x.CommentText,
                x.IsSuccess,
                x.ErrorMessage,
                x.ActorUserCode,
                x.ActorRole,
                x.CorrelationID,
                x.CreatedAt));

            return OperationResult<TopicWorkflowAuditListDto>.Succeeded(new TopicWorkflowAuditListDto(items, totalCount));
        }
    }
}

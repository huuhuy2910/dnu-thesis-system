using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Workflows.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Workflows
{
    public interface ITopicWorkflowTimelineQueryProcessor
    {
        Task<OperationResult<TopicWorkflowTimelineDto>> GetTimelineByTopicIdAsync(int topicId);
        Task<OperationResult<TopicWorkflowTimelineDto>> GetTimelineByTopicCodeAsync(string topicCode);
    }

    public class TopicWorkflowTimelineQueryProcessor : ITopicWorkflowTimelineQueryProcessor
    {
        private readonly IUnitOfWork _uow;

        public TopicWorkflowTimelineQueryProcessor(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<TopicWorkflowTimelineDto>> GetTimelineByTopicIdAsync(int topicId)
        {
            if (topicId <= 0)
                return OperationResult<TopicWorkflowTimelineDto>.Failed("Invalid topic id", 400);

            var topic = await _uow.Topics.GetByIdAsync(topicId);
            if (topic == null)
                return OperationResult<TopicWorkflowTimelineDto>.Failed("Topic not found", 404);

            return await BuildTimelineAsync(topic.TopicID, topic.TopicCode);
        }

        public async Task<OperationResult<TopicWorkflowTimelineDto>> GetTimelineByTopicCodeAsync(string topicCode)
        {
            if (string.IsNullOrWhiteSpace(topicCode))
                return OperationResult<TopicWorkflowTimelineDto>.Failed("Topic code is required", 400);

            var topic = await _uow.Topics.GetByCodeAsync(topicCode);
            if (topic == null)
                return OperationResult<TopicWorkflowTimelineDto>.Failed("Topic not found", 404);

            return await BuildTimelineAsync(topic.TopicID, topic.TopicCode);
        }

        private async Task<OperationResult<TopicWorkflowTimelineDto>> BuildTimelineAsync(int topicId, string topicCode)
        {
            var events = await _uow.TopicWorkflowAudits.Query()
                .Where(x => x.TopicID == topicId || x.TopicCode == topicCode)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new TopicWorkflowTimelineItemDto(
                    x.AuditID,
                    x.AuditCode,
                    x.ActionType,
                    x.DecisionAction,
                    x.OldStatus,
                    x.NewStatus,
                    x.StatusCode,
                    x.CommentText,
                    x.ActorUserCode,
                    x.IsSuccess,
                    x.CreatedAt))
                .ToListAsync();

            return OperationResult<TopicWorkflowTimelineDto>.Succeeded(new TopicWorkflowTimelineDto(topicId, topicCode, events));
        }
    }
}

using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Workflows.Query;

namespace ThesisManagement.Api.Application.Query.Workflows
{
    public interface IGetTopicWorkflowDetailQuery
    {
        Task<OperationResult<TopicWorkflowDetailDto>> ExecuteAsync(int topicId);
    }

    public interface IGetTopicWorkflowAuditHistoryQuery
    {
        Task<OperationResult<TopicWorkflowAuditListDto>> ExecuteAsync(TopicWorkflowAuditFilter filter);
    }

    public interface IGetTopicWorkflowTimelineByTopicIdQuery
    {
        Task<OperationResult<TopicWorkflowTimelineDto>> ExecuteAsync(int topicId);
    }

    public interface IGetTopicWorkflowTimelineByTopicCodeQuery
    {
        Task<OperationResult<TopicWorkflowTimelineDto>> ExecuteAsync(string topicCode);
    }

    public class GetTopicWorkflowDetailQuery : IGetTopicWorkflowDetailQuery
    {
        private readonly ITopicWorkflowDetailAuditQueryProcessor _processor;

        public GetTopicWorkflowDetailQuery(ITopicWorkflowDetailAuditQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowDetailDto>> ExecuteAsync(int topicId)
            => _processor.GetDetailAsync(topicId);
    }

    public class GetTopicWorkflowAuditHistoryQuery : IGetTopicWorkflowAuditHistoryQuery
    {
        private readonly ITopicWorkflowDetailAuditQueryProcessor _processor;

        public GetTopicWorkflowAuditHistoryQuery(ITopicWorkflowDetailAuditQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowAuditListDto>> ExecuteAsync(TopicWorkflowAuditFilter filter)
            => _processor.GetAuditHistoryAsync(filter);
    }

    public class GetTopicWorkflowTimelineByTopicIdQuery : IGetTopicWorkflowTimelineByTopicIdQuery
    {
        private readonly ITopicWorkflowTimelineQueryProcessor _processor;

        public GetTopicWorkflowTimelineByTopicIdQuery(ITopicWorkflowTimelineQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowTimelineDto>> ExecuteAsync(int topicId)
            => _processor.GetTimelineByTopicIdAsync(topicId);
    }

    public class GetTopicWorkflowTimelineByTopicCodeQuery : IGetTopicWorkflowTimelineByTopicCodeQuery
    {
        private readonly ITopicWorkflowTimelineQueryProcessor _processor;

        public GetTopicWorkflowTimelineByTopicCodeQuery(ITopicWorkflowTimelineQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowTimelineDto>> ExecuteAsync(string topicCode)
            => _processor.GetTimelineByTopicCodeAsync(topicCode);
    }
}

using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Workflows.Command;
using ThesisManagement.Api.DTOs.Workflows.Query;

namespace ThesisManagement.Api.Application.Command.Workflows
{
    public interface ISubmitTopicWorkflowCommand
    {
        Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(TopicResubmitWorkflowRequestDto request);
    }

    public interface IResubmitTopicWorkflowCommand
    {
        Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(TopicResubmitWorkflowRequestDto request);
    }

    public interface IDecideTopicWorkflowCommand
    {
        Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(int topicId, TopicDecisionWorkflowRequestDto request);
    }

    public interface IRollbackStudentWorkflowTestDataCommand
    {
        Task<OperationResult<TopicWorkflowRollbackResultDto>> ExecuteAsync(string? topicCode = null);
    }

    public class SubmitTopicWorkflowCommand : ISubmitTopicWorkflowCommand
    {
        private readonly IResubmitTopicWorkflowCommandProcessor _processor;

        public SubmitTopicWorkflowCommand(IResubmitTopicWorkflowCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(TopicResubmitWorkflowRequestDto request)
            => _processor.SubmitAsync(request);
    }

    public class ResubmitTopicWorkflowCommand : IResubmitTopicWorkflowCommand
    {
        private readonly IResubmitTopicWorkflowCommandProcessor _processor;

        public ResubmitTopicWorkflowCommand(IResubmitTopicWorkflowCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(TopicResubmitWorkflowRequestDto request)
            => _processor.ResubmitAsync(request);
    }

    public class DecideTopicWorkflowCommand : IDecideTopicWorkflowCommand
    {
        private readonly IDecideTopicWorkflowCommandProcessor _processor;

        public DecideTopicWorkflowCommand(IDecideTopicWorkflowCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowResultDto>> ExecuteAsync(int topicId, TopicDecisionWorkflowRequestDto request)
            => _processor.DecideAsync(topicId, request);
    }

    public class RollbackStudentWorkflowTestDataCommand : IRollbackStudentWorkflowTestDataCommand
    {
        private readonly IRollbackStudentWorkflowTestDataCommandProcessor _processor;

        public RollbackStudentWorkflowTestDataCommand(IRollbackStudentWorkflowTestDataCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<TopicWorkflowRollbackResultDto>> ExecuteAsync(string? topicCode = null)
            => _processor.ExecuteAsync(topicCode);
    }
}

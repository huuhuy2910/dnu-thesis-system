using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.Application.Command.CommitteeAssignments
{
    public interface ICreateCommitteeCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeCreateRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCommitteeCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string committeeCode, CommitteeUpdateRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCommitteeMembersCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeMembersUpdateRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface ISaveCommitteeMembersCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeMembersCreateRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IDeleteCommitteeCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(string committeeCode, bool force, CancellationToken cancellationToken = default);
    }

    public interface IAssignTopicsCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(AssignTopicRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IAutoAssignTopicsCommand
    {
        Task<ApiResponse<object>> ExecuteAsync(AutoAssignRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IChangeAssignmentCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(ChangeAssignmentRequestDto request, CancellationToken cancellationToken = default);
    }

    public interface IRemoveAssignmentCommand
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string topicCode, CancellationToken cancellationToken = default);
    }

    public class CreateCommitteeCommand : ICreateCommitteeCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public CreateCommitteeCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeCreateRequestDto request, CancellationToken cancellationToken = default)
            => _processor.CreateCommitteeAsync(request, cancellationToken);
    }

    public class UpdateCommitteeCommand : IUpdateCommitteeCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public UpdateCommitteeCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string committeeCode, CommitteeUpdateRequestDto request, CancellationToken cancellationToken = default)
            => _processor.UpdateCommitteeAsync(committeeCode, request, cancellationToken);
    }

    public class UpdateCommitteeMembersCommand : IUpdateCommitteeMembersCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public UpdateCommitteeMembersCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeMembersUpdateRequestDto request, CancellationToken cancellationToken = default)
            => _processor.UpdateCommitteeMembersAsync(request, cancellationToken);
    }

    public class SaveCommitteeMembersCommand : ISaveCommitteeMembersCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public SaveCommitteeMembersCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(CommitteeMembersCreateRequestDto request, CancellationToken cancellationToken = default)
            => _processor.SaveCommitteeMembersAsync(request, cancellationToken);
    }

    public class DeleteCommitteeCommand : IDeleteCommitteeCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public DeleteCommitteeCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<bool>> ExecuteAsync(string committeeCode, bool force, CancellationToken cancellationToken = default)
            => _processor.DeleteCommitteeAsync(committeeCode, force, cancellationToken);
    }

    public class AssignTopicsCommand : IAssignTopicsCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public AssignTopicsCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(AssignTopicRequestDto request, CancellationToken cancellationToken = default)
            => _processor.AssignTopicsAsync(request, cancellationToken);
    }

    public class AutoAssignTopicsCommand : IAutoAssignTopicsCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public AutoAssignTopicsCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<object>> ExecuteAsync(AutoAssignRequestDto request, CancellationToken cancellationToken = default)
            => _processor.AutoAssignTopicsAsync(request, cancellationToken);
    }

    public class ChangeAssignmentCommand : IChangeAssignmentCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public ChangeAssignmentCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(ChangeAssignmentRequestDto request, CancellationToken cancellationToken = default)
            => _processor.ChangeAssignmentAsync(request, cancellationToken);
    }

    public class RemoveAssignmentCommand : IRemoveAssignmentCommand
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public RemoveAssignmentCommand(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string topicCode, CancellationToken cancellationToken = default)
            => _processor.RemoveAssignmentAsync(topicCode, cancellationToken);
    }
}

using ThesisManagement.Api.Application.Command.DefensePeriods;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Application.Command.DefenseSetup
{
    public interface ISyncDefensePeriodCommand
    {
        Task<ApiResponse<SyncDefensePeriodResponseDto>> ExecuteAsync(int periodId, SyncDefensePeriodRequestDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IUpdateDefensePeriodConfigCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, UpdateDefensePeriodConfigDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface ILockLecturerCapabilitiesCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IConfirmCouncilConfigCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, ConfirmCouncilConfigDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IGenerateCouncilsCommand
    {
        Task<ApiResponse<List<CouncilDraftDto>>> ExecuteAsync(int periodId, GenerateCouncilsRequestDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface ICreateCouncilCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCouncilCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IDeleteCouncilCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, int councilId, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IGenerateCouncilCodeCommand
    {
        Task<ApiResponse<GenerateCouncilCodeResponseDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface ICreateCouncilStep1Command
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCouncilStep1Command
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface ISaveCouncilMembersStepCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep2Dto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface ISaveCouncilTopicsStepCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep3Dto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IAddCouncilMemberItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, AddCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCouncilMemberItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, string lecturerCode, UpdateCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IRemoveCouncilMemberItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, string lecturerCode, RemoveCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IAddCouncilTopicItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, AddCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IUpdateCouncilTopicItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, int assignmentId, UpdateCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IRemoveCouncilTopicItemCommand
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, int assignmentId, RemoveCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IFinalizeDefensePeriodCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public interface IRollbackDefensePeriodCommand
    {
        Task<ApiResponse<RollbackDefensePeriodResponseDto>> ExecuteAsync(int periodId, RollbackDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
    }

    public class SyncDefensePeriodCommand : ISyncDefensePeriodCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public SyncDefensePeriodCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<SyncDefensePeriodResponseDto>> ExecuteAsync(int periodId, SyncDefensePeriodRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.SyncAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class UpdateDefensePeriodConfigCommand : IUpdateDefensePeriodConfigCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateDefensePeriodConfigCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, UpdateDefensePeriodConfigDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateConfigAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class LockLecturerCapabilitiesCommand : ILockLecturerCapabilitiesCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public LockLecturerCapabilitiesCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.LockLecturerCapabilitiesAsync(periodId, actorUserId, cancellationToken);
    }

    public class ConfirmCouncilConfigCommand : IConfirmCouncilConfigCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public ConfirmCouncilConfigCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, ConfirmCouncilConfigDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.ConfirmCouncilConfigAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class GenerateCouncilsCommand : IGenerateCouncilsCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public GenerateCouncilsCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<CouncilDraftDto>>> ExecuteAsync(int periodId, GenerateCouncilsRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.GenerateCouncilsAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class CreateCouncilCommand : ICreateCouncilCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public CreateCouncilCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.CreateCouncilAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class UpdateCouncilCommand : IUpdateCouncilCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateCouncilCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateCouncilAsync(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class DeleteCouncilCommand : IDeleteCouncilCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public DeleteCouncilCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, int councilId, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.DeleteCouncilAsync(periodId, councilId, actorUserId, cancellationToken);
    }

    public class GenerateCouncilCodeCommand : IGenerateCouncilCodeCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public GenerateCouncilCodeCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<GenerateCouncilCodeResponseDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GenerateCouncilCodeAsync(periodId, cancellationToken);
    }

    public class CreateCouncilStep1Command : ICreateCouncilStep1Command
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public CreateCouncilStep1Command(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.CreateCouncilStep1Async(periodId, request, actorUserId, cancellationToken);
    }

    public class UpdateCouncilStep1Command : IUpdateCouncilStep1Command
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateCouncilStep1Command(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateCouncilStep1Async(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class SaveCouncilMembersStepCommand : ISaveCouncilMembersStepCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public SaveCouncilMembersStepCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep2Dto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.SaveCouncilMembersStepAsync(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class SaveCouncilTopicsStepCommand : ISaveCouncilTopicsStepCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public SaveCouncilTopicsStepCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CouncilWorkflowStep3Dto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.SaveCouncilTopicsStepAsync(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class AddCouncilMemberItemCommand : IAddCouncilMemberItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public AddCouncilMemberItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, AddCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.AddCouncilMemberItemAsync(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class UpdateCouncilMemberItemCommand : IUpdateCouncilMemberItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateCouncilMemberItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, string lecturerCode, UpdateCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateCouncilMemberItemAsync(periodId, councilId, lecturerCode, request, actorUserId, cancellationToken);
    }

    public class RemoveCouncilMemberItemCommand : IRemoveCouncilMemberItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public RemoveCouncilMemberItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, string lecturerCode, RemoveCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.RemoveCouncilMemberItemAsync(periodId, councilId, lecturerCode, request, actorUserId, cancellationToken);
    }

    public class AddCouncilTopicItemCommand : IAddCouncilTopicItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public AddCouncilTopicItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, AddCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.AddCouncilTopicItemAsync(periodId, councilId, request, actorUserId, cancellationToken);
    }

    public class UpdateCouncilTopicItemCommand : IUpdateCouncilTopicItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateCouncilTopicItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, int assignmentId, UpdateCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateCouncilTopicItemAsync(periodId, councilId, assignmentId, request, actorUserId, cancellationToken);
    }

    public class RemoveCouncilTopicItemCommand : IRemoveCouncilTopicItemCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public RemoveCouncilTopicItemCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, int assignmentId, RemoveCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.RemoveCouncilTopicItemAsync(periodId, councilId, assignmentId, request, actorUserId, cancellationToken);
    }

    public class FinalizeDefensePeriodCommand : IFinalizeDefensePeriodCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public FinalizeDefensePeriodCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.FinalizeAsync(periodId, request, actorUserId, cancellationToken);
    }

    public class RollbackDefensePeriodCommand : IRollbackDefensePeriodCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public RollbackDefensePeriodCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<RollbackDefensePeriodResponseDto>> ExecuteAsync(int periodId, RollbackDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.RollbackAsync(periodId, request, actorUserId, cancellationToken);
    }
}

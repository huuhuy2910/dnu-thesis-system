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

    public interface IUpdateLecturerBusySlotsCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, string lecturerCode, UpdateLecturerBusySlotsDto request, int actorUserId, CancellationToken cancellationToken = default);
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

    public interface IFinalizeDefensePeriodCommand
    {
        Task<ApiResponse<bool>> ExecuteAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
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

    public class UpdateLecturerBusySlotsCommand : IUpdateLecturerBusySlotsCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public UpdateLecturerBusySlotsCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, string lecturerCode, UpdateLecturerBusySlotsDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.UpdateLecturerBusySlotsAsync(periodId, lecturerCode, request, actorUserId, cancellationToken);
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

    public class FinalizeDefensePeriodCommand : IFinalizeDefensePeriodCommand
    {
        private readonly IDefensePeriodCommandProcessor _processor;
        public FinalizeDefensePeriodCommand(IDefensePeriodCommandProcessor processor) => _processor = processor;
        public Task<ApiResponse<bool>> ExecuteAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
            => _processor.FinalizeAsync(periodId, request, actorUserId, cancellationToken);
    }
}

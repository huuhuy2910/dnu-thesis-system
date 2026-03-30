using ThesisManagement.Api.Application.Query.DefensePeriods;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Application.Query.DefenseSetup
{
    public interface IGetDefensePeriodStudentsQuery
    {
        Task<ApiResponse<List<EligibleStudentDto>>> ExecuteAsync(int periodId, bool eligibleOnly, CancellationToken cancellationToken = default);
    }

    public interface IGetDefensePeriodConfigQuery
    {
        Task<ApiResponse<DefensePeriodConfigDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IGetDefensePeriodStateQuery
    {
        Task<ApiResponse<DefensePeriodStateDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IGetDefenseSyncErrorsQuery
    {
        Task<ApiResponse<List<SyncErrorDetailDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IExportDefenseSyncErrorsQuery
    {
        Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> ExecuteAsync(int periodId, string format, CancellationToken cancellationToken = default);
    }

    public interface IGetLecturerCapabilitiesQueryV2
    {
        Task<ApiResponse<List<LecturerCapabilityDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IGetLecturerBusySlotsQuery
    {
        Task<ApiResponse<List<LecturerBusySlotsDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilsQueryV2
    {
        Task<ApiResponse<PagedResult<CouncilDraftDto>>> ExecuteAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilDetailQueryV2
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilAuditHistoryQuery
    {
        Task<ApiResponse<List<CouncilAuditHistoryDto>>> ExecuteAsync(int periodId, int? councilId, CancellationToken cancellationToken = default);
    }

    public class GetDefensePeriodStudentsQuery : IGetDefensePeriodStudentsQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetDefensePeriodStudentsQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<EligibleStudentDto>>> ExecuteAsync(int periodId, bool eligibleOnly, CancellationToken cancellationToken = default)
            => _processor.GetStudentsAsync(periodId, eligibleOnly, cancellationToken);
    }

    public class GetDefensePeriodConfigQuery : IGetDefensePeriodConfigQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetDefensePeriodConfigQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<DefensePeriodConfigDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetConfigAsync(periodId, cancellationToken);
    }

    public class GetDefensePeriodStateQuery : IGetDefensePeriodStateQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetDefensePeriodStateQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<DefensePeriodStateDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetStateAsync(periodId, cancellationToken);
    }

    public class GetDefenseSyncErrorsQuery : IGetDefenseSyncErrorsQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetDefenseSyncErrorsQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<SyncErrorDetailDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetSyncErrorsAsync(periodId, cancellationToken);
    }

    public class ExportDefenseSyncErrorsQuery : IExportDefenseSyncErrorsQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public ExportDefenseSyncErrorsQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> ExecuteAsync(int periodId, string format, CancellationToken cancellationToken = default)
            => _processor.ExportSyncErrorsAsync(periodId, format, cancellationToken);
    }

    public class GetLecturerCapabilitiesQueryV2 : IGetLecturerCapabilitiesQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetLecturerCapabilitiesQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<LecturerCapabilityDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetLecturerCapabilitiesAsync(periodId, cancellationToken);
    }

    public class GetLecturerBusySlotsQuery : IGetLecturerBusySlotsQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetLecturerBusySlotsQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<LecturerBusySlotsDto>>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetLecturerBusySlotsAsync(periodId, cancellationToken);
    }

    public class GetCouncilsQueryV2 : IGetCouncilsQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilsQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<PagedResult<CouncilDraftDto>>> ExecuteAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default)
            => _processor.GetCouncilsAsync(periodId, filter, cancellationToken);
    }

    public class GetCouncilDetailQueryV2 : IGetCouncilDetailQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilDetailQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CancellationToken cancellationToken = default)
            => _processor.GetCouncilDetailAsync(periodId, councilId, cancellationToken);
    }

    public class GetCouncilAuditHistoryQuery : IGetCouncilAuditHistoryQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilAuditHistoryQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<CouncilAuditHistoryDto>>> ExecuteAsync(int periodId, int? councilId, CancellationToken cancellationToken = default)
            => _processor.GetCouncilAuditHistoryAsync(periodId, councilId, cancellationToken);
    }
}

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

    public interface IGetRollbackAvailabilityQuery
    {
        Task<ApiResponse<RollbackAvailabilityDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
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

    public interface IGetCouncilsQueryV2
    {
        Task<ApiResponse<PagedResult<CouncilDraftDto>>> ExecuteAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilCalendarQuery
    {
        Task<ApiResponse<List<DefensePeriodCalendarDayDto>>> ExecuteAsync(int periodId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilDetailQueryV2
    {
        Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CancellationToken cancellationToken = default);
    }

    public interface IGetTopicTagsQueryV2
    {
        Task<ApiResponse<List<TopicTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default);
    }

    public interface IGetLecturerTagsQueryV2
    {
        Task<ApiResponse<List<LecturerTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default);
    }

    public interface IGetCommitteeTagsQueryV2
    {
        Task<ApiResponse<List<CommitteeTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default);
    }

    public interface IGetDefenseTagOverviewQueryV2
    {
        Task<ApiResponse<DefensePeriodTagOverviewDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default);
    }

    public interface IGetCouncilAuditHistoryQuery
    {
        Task<ApiResponse<List<CouncilAuditHistoryDto>>> ExecuteAsync(int periodId, int? councilId, CancellationToken cancellationToken = default);
    }

    public interface IGetRevisionAuditTrailQuery
    {
        Task<ApiResponse<List<RevisionAuditTrailDto>>> ExecuteAsync(int periodId, int revisionId, CancellationToken cancellationToken = default);
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

    public class GetRollbackAvailabilityQuery : IGetRollbackAvailabilityQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetRollbackAvailabilityQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<RollbackAvailabilityDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetRollbackAvailabilityAsync(periodId, cancellationToken);
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

    public class GetCouncilsQueryV2 : IGetCouncilsQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilsQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<PagedResult<CouncilDraftDto>>> ExecuteAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default)
            => _processor.GetCouncilsAsync(periodId, filter, cancellationToken);
    }

    public class GetCouncilCalendarQuery : IGetCouncilCalendarQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;

        public GetCouncilCalendarQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;

        public Task<ApiResponse<List<DefensePeriodCalendarDayDto>>> ExecuteAsync(int periodId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
            => _processor.GetCouncilCalendarAsync(periodId, fromDate, toDate, cancellationToken);
    }

    public class GetCouncilDetailQueryV2 : IGetCouncilDetailQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilDetailQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<CouncilDraftDto>> ExecuteAsync(int periodId, int councilId, CancellationToken cancellationToken = default)
            => _processor.GetCouncilDetailAsync(periodId, councilId, cancellationToken);
    }

    public class GetTopicTagsQueryV2 : IGetTopicTagsQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetTopicTagsQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<TopicTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default)
            => _processor.GetTopicTagsAsync(periodId, tagCode, cancellationToken);
    }

    public class GetLecturerTagsQueryV2 : IGetLecturerTagsQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetLecturerTagsQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<LecturerTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default)
            => _processor.GetLecturerTagsAsync(periodId, tagCode, cancellationToken);
    }

    public class GetCommitteeTagsQueryV2 : IGetCommitteeTagsQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCommitteeTagsQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<CommitteeTagUsageDto>>> ExecuteAsync(int periodId, string? tagCode = null, CancellationToken cancellationToken = default)
            => _processor.GetCommitteeTagsAsync(periodId, tagCode, cancellationToken);
    }

    public class GetDefenseTagOverviewQueryV2 : IGetDefenseTagOverviewQueryV2
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetDefenseTagOverviewQueryV2(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<DefensePeriodTagOverviewDto>> ExecuteAsync(int periodId, CancellationToken cancellationToken = default)
            => _processor.GetTagOverviewAsync(periodId, cancellationToken);
    }

    public class GetCouncilAuditHistoryQuery : IGetCouncilAuditHistoryQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetCouncilAuditHistoryQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<CouncilAuditHistoryDto>>> ExecuteAsync(int periodId, int? councilId, CancellationToken cancellationToken = default)
            => _processor.GetCouncilAuditHistoryAsync(periodId, councilId, cancellationToken);
    }

    public class GetRevisionAuditTrailQuery : IGetRevisionAuditTrailQuery
    {
        private readonly IDefensePeriodQueryProcessor _processor;
        public GetRevisionAuditTrailQuery(IDefensePeriodQueryProcessor processor) => _processor = processor;
        public Task<ApiResponse<List<RevisionAuditTrailDto>>> ExecuteAsync(int periodId, int revisionId, CancellationToken cancellationToken = default)
            => _processor.GetRevisionAuditTrailAsync(periodId, revisionId, cancellationToken);
    }
}

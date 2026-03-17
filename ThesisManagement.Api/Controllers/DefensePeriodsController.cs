using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.DefenseExecution;
using ThesisManagement.Api.Application.Command.DefenseSetup;
using ThesisManagement.Api.Application.Query.DefenseExecution;
using ThesisManagement.Api.Application.Query.DefenseSetup;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/v1/defense-periods")]
    [Authorize]
    public class DefensePeriodsController : BaseApiController
    {
        private readonly ISyncDefensePeriodCommand _syncCommand;
        private readonly IGetDefensePeriodStudentsQuery _getStudentsQuery;
        private readonly IGetDefensePeriodConfigQuery _getConfigQuery;
        private readonly IGetDefensePeriodStateQuery _getStateQuery;
        private readonly IGetDefenseSyncErrorsQuery _getSyncErrorsQuery;
        private readonly IExportDefenseSyncErrorsQuery _exportSyncErrorsQuery;
        private readonly IGetLecturerCapabilitiesQueryV2 _getLecturerCapabilitiesQuery;
        private readonly IGetLecturerBusySlotsQuery _getLecturerBusySlotsQuery;
        private readonly IUpdateLecturerBusySlotsCommand _updateLecturerBusySlotsCommand;
        private readonly IUpdateDefensePeriodConfigCommand _updateConfigCommand;
        private readonly ILockLecturerCapabilitiesCommand _lockCapabilitiesCommand;
        private readonly IConfirmCouncilConfigCommand _confirmCouncilConfigCommand;
        private readonly IGenerateCouncilsCommand _generateCouncilsCommand;
        private readonly IGetCouncilsQueryV2 _getCouncilsQuery;
        private readonly IGetCouncilDetailQueryV2 _getCouncilDetailQuery;
        private readonly ICreateCouncilCommand _createCouncilCommand;
        private readonly IUpdateCouncilCommand _updateCouncilCommand;
        private readonly IDeleteCouncilCommand _deleteCouncilCommand;
        private readonly IFinalizeDefensePeriodCommand _finalizeCommand;
        private readonly IPublishDefensePeriodScoresCommand _publishScoresCommand;
        private readonly IGetDefenseOverviewAnalyticsQuery _overviewQuery;
        private readonly IGetDefenseByCouncilAnalyticsQuery _byCouncilQuery;
        private readonly IGetDefenseDistributionAnalyticsQuery _distributionQuery;
        private readonly IBuildDefenseReportQuery _reportQuery;
        private readonly IGetDefenseExportHistoryQuery _exportHistoryQuery;
        private readonly IGetDefensePublishHistoryQuery _publishHistoryQuery;
        private readonly IGetCouncilAuditHistoryQuery _councilAuditHistoryQuery;

        public DefensePeriodsController(
            Services.IUnitOfWork uow,
            Services.ICodeGenerator codeGen,
            AutoMapper.IMapper mapper,
            ISyncDefensePeriodCommand syncCommand,
            IGetDefensePeriodStudentsQuery getStudentsQuery,
            IGetDefensePeriodConfigQuery getConfigQuery,
            IGetDefensePeriodStateQuery getStateQuery,
            IGetDefenseSyncErrorsQuery getSyncErrorsQuery,
            IExportDefenseSyncErrorsQuery exportSyncErrorsQuery,
            IGetLecturerCapabilitiesQueryV2 getLecturerCapabilitiesQuery,
            IGetLecturerBusySlotsQuery getLecturerBusySlotsQuery,
            IUpdateLecturerBusySlotsCommand updateLecturerBusySlotsCommand,
            IUpdateDefensePeriodConfigCommand updateConfigCommand,
            ILockLecturerCapabilitiesCommand lockCapabilitiesCommand,
            IConfirmCouncilConfigCommand confirmCouncilConfigCommand,
            IGenerateCouncilsCommand generateCouncilsCommand,
            IGetCouncilsQueryV2 getCouncilsQuery,
            IGetCouncilDetailQueryV2 getCouncilDetailQuery,
            ICreateCouncilCommand createCouncilCommand,
            IUpdateCouncilCommand updateCouncilCommand,
            IDeleteCouncilCommand deleteCouncilCommand,
            IFinalizeDefensePeriodCommand finalizeCommand,
            IPublishDefensePeriodScoresCommand publishScoresCommand,
            IGetDefenseOverviewAnalyticsQuery overviewQuery,
            IGetDefenseByCouncilAnalyticsQuery byCouncilQuery,
            IGetDefenseDistributionAnalyticsQuery distributionQuery,
            IBuildDefenseReportQuery reportQuery,
            IGetDefenseExportHistoryQuery exportHistoryQuery,
            IGetDefensePublishHistoryQuery publishHistoryQuery,
            IGetCouncilAuditHistoryQuery councilAuditHistoryQuery) : base(uow, codeGen, mapper)
        {
            _syncCommand = syncCommand;
            _getStudentsQuery = getStudentsQuery;
            _getConfigQuery = getConfigQuery;
            _getStateQuery = getStateQuery;
            _getSyncErrorsQuery = getSyncErrorsQuery;
            _exportSyncErrorsQuery = exportSyncErrorsQuery;
            _getLecturerCapabilitiesQuery = getLecturerCapabilitiesQuery;
            _getLecturerBusySlotsQuery = getLecturerBusySlotsQuery;
            _updateLecturerBusySlotsCommand = updateLecturerBusySlotsCommand;
            _updateConfigCommand = updateConfigCommand;
            _lockCapabilitiesCommand = lockCapabilitiesCommand;
            _confirmCouncilConfigCommand = confirmCouncilConfigCommand;
            _generateCouncilsCommand = generateCouncilsCommand;
            _getCouncilsQuery = getCouncilsQuery;
            _getCouncilDetailQuery = getCouncilDetailQuery;
            _createCouncilCommand = createCouncilCommand;
            _updateCouncilCommand = updateCouncilCommand;
            _deleteCouncilCommand = deleteCouncilCommand;
            _finalizeCommand = finalizeCommand;
            _publishScoresCommand = publishScoresCommand;
            _overviewQuery = overviewQuery;
            _byCouncilQuery = byCouncilQuery;
            _distributionQuery = distributionQuery;
            _reportQuery = reportQuery;
            _exportHistoryQuery = exportHistoryQuery;
            _publishHistoryQuery = publishHistoryQuery;
            _councilAuditHistoryQuery = councilAuditHistoryQuery;
        }

        [HttpPost("{periodId:int}/sync")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<SyncDefensePeriodResponseDto>>> Sync(int periodId, [FromBody] SyncDefensePeriodRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _syncCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/students")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<EligibleStudentDto>>>> GetStudents(int periodId, [FromQuery] bool eligible = true)
        {
            var result = await _getStudentsQuery.ExecuteAsync(periodId, eligible);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/config")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodConfigDto>>> GetConfig(int periodId)
        {
            var result = await _getConfigQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/state")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodStateDto>>> GetState(int periodId)
        {
            var result = await _getStateQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/sync/errors")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<SyncErrorDetailDto>>>> GetSyncErrors(int periodId)
        {
            var result = await _getSyncErrorsQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/sync/errors/export")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<IActionResult> ExportSyncErrors(int periodId, [FromQuery] string format = "csv")
        {
            var result = await _exportSyncErrorsQuery.ExecuteAsync(periodId, format);
            if (!result.Success)
            {
                return StatusCode(result.HttpStatusCode == 0 ? 400 : result.HttpStatusCode, result);
            }

            return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
        }

        [HttpGet("{periodId:int}/lecturer-capabilities")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<LecturerCapabilityDto>>>> GetLecturerCapabilities(int periodId)
        {
            var result = await _getLecturerCapabilitiesQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/lecturer-busy-times")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<LecturerBusySlotsDto>>>> GetLecturerBusyTimes(int periodId)
        {
            var result = await _getLecturerBusySlotsQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/lecturer-busy-times/{lecturerCode}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateLecturerBusyTimes(int periodId, string lecturerCode, [FromBody] UpdateLecturerBusySlotsDto request)
        {
            var result = await _updateLecturerBusySlotsCommand.ExecuteAsync(periodId, lecturerCode, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/config")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateConfig(int periodId, [FromBody] UpdateDefensePeriodConfigDto request)
        {
            var result = await _updateConfigCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/lecturer-capabilities/lock")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> LockLecturerCapabilities(int periodId)
        {
            var result = await _lockCapabilitiesCommand.ExecuteAsync(periodId, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/council-config/confirm")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> ConfirmCouncilConfig(int periodId, [FromBody] ConfirmCouncilConfigDto request)
        {
            var result = await _confirmCouncilConfigCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils/generate")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilDraftDto>>>> GenerateCouncils(int periodId, [FromBody] GenerateCouncilsRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _generateCouncilsCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/councils")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<PagedResult<CouncilDraftDto>>>> GetCouncils(int periodId, [FromQuery] string? keyword, [FromQuery] string? tag, [FromQuery] string? room, [FromQuery] int page = 1, [FromQuery] int size = 20)
        {
            var filter = new CouncilFilterDto
            {
                Keyword = keyword,
                Tag = tag,
                Room = room,
                Page = page,
                Size = size
            };

            var result = await _getCouncilsQuery.ExecuteAsync(periodId, filter);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/councils/{councilId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> GetCouncilDetail(int periodId, int councilId)
        {
            var result = await _getCouncilDetailQuery.ExecuteAsync(periodId, councilId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> CreateCouncil(int periodId, [FromBody] CouncilUpsertDto request)
        {
            var result = await _createCouncilCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 201 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> UpdateCouncil(int periodId, int councilId, [FromBody] CouncilUpsertDto request)
        {
            var result = await _updateCouncilCommand.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpDelete("{periodId:int}/councils/{councilId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteCouncil(int periodId, int councilId)
        {
            var result = await _deleteCouncilCommand.ExecuteAsync(periodId, councilId, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/finalize")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> FinalizePeriod(int periodId, [FromBody] FinalizeDefensePeriodDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _finalizeCommand.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/publish-scores")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> PublishScores(int periodId, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var result = await _publishScoresCommand.ExecuteAsync(periodId, CurrentUserId, idempotencyKey);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/analytics/overview")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<AnalyticsOverviewDto>>> GetOverview(int periodId)
        {
            var result = await _overviewQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/analytics/by-council")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilAnalyticsDto>>>> GetByCouncil(int periodId)
        {
            var result = await _byCouncilQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/analytics/distribution")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<AnalyticsDistributionDto>>> GetDistribution(int periodId)
        {
            var result = await _distributionQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/reports/council-summary")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<IActionResult> ExportCouncilSummary(int periodId, [FromQuery] string format = "csv")
        {
            var result = await _reportQuery.ExecuteAsync(periodId, "council-summary", format, null);
            if (!result.Success)
            {
                return StatusCode(result.HttpStatusCode == 0 ? 400 : result.HttpStatusCode, result);
            }

            return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
        }

        [HttpGet("{periodId:int}/reports/form-1")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<IActionResult> ExportForm1(int periodId, [FromQuery] int councilId, [FromQuery] string format = "csv")
        {
            var result = await _reportQuery.ExecuteAsync(periodId, "form-1", format, councilId);
            if (!result.Success)
            {
                return StatusCode(result.HttpStatusCode == 0 ? 400 : result.HttpStatusCode, result);
            }

            return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
        }

        [HttpGet("{periodId:int}/reports/final-term")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<IActionResult> ExportFinalTerm(int periodId, [FromQuery] int? councilId = null, [FromQuery] string format = "csv")
        {
            var result = await _reportQuery.ExecuteAsync(periodId, "final-term", format, councilId);
            if (!result.Success)
            {
                return StatusCode(result.HttpStatusCode == 0 ? 400 : result.HttpStatusCode, result);
            }

            return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
        }

        [HttpGet("{periodId:int}/reports/export-history")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<ExportHistoryDto>>>> GetExportHistory(int periodId)
        {
            var result = await _exportHistoryQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/publish-history")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<PublishHistoryDto>>>> GetPublishHistory(int periodId)
        {
            var result = await _publishHistoryQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/councils/audit-history")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilAuditHistoryDto>>>> GetCouncilAuditHistory(int periodId, [FromQuery] int? councilId = null)
        {
            var result = await _councilAuditHistoryQuery.ExecuteAsync(periodId, councilId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }
    }
}

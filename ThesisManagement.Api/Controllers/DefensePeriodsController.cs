using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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
        private readonly IGetRollbackAvailabilityQuery _getRollbackAvailabilityQuery;
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
        private readonly IGetTopicTagsQueryV2 _getTopicTagsQuery;
        private readonly IGetLecturerTagsQueryV2 _getLecturerTagsQuery;
        private readonly IGetCommitteeTagsQueryV2 _getCommitteeTagsQuery;
        private readonly IGetDefenseTagOverviewQueryV2 _getDefenseTagOverviewQuery;
        private readonly IGetCouncilCalendarQuery _getCouncilCalendarQuery;
        private readonly ICreateCouncilCommand _createCouncilCommand;
        private readonly IUpdateCouncilCommand _updateCouncilCommand;
        private readonly IDeleteCouncilCommand _deleteCouncilCommand;
        private readonly IGenerateCouncilCodeCommand _generateCouncilCodeCommand;
        private readonly ICreateCouncilStep1Command _createCouncilStep1Command;
        private readonly IUpdateCouncilStep1Command _updateCouncilStep1Command;
        private readonly ISaveCouncilMembersStepCommand _saveCouncilMembersStepCommand;
        private readonly ISaveCouncilTopicsStepCommand _saveCouncilTopicsStepCommand;
        private readonly IAddCouncilMemberItemCommand _addCouncilMemberItemCommand;
        private readonly IUpdateCouncilMemberItemCommand _updateCouncilMemberItemCommand;
        private readonly IRemoveCouncilMemberItemCommand _removeCouncilMemberItemCommand;
        private readonly IAddCouncilTopicItemCommand _addCouncilTopicItemCommand;
        private readonly IUpdateCouncilTopicItemCommand _updateCouncilTopicItemCommand;
        private readonly IRemoveCouncilTopicItemCommand _removeCouncilTopicItemCommand;
        private readonly IFinalizeDefensePeriodCommand _finalizeCommand;
        private readonly IRollbackDefensePeriodCommand _rollbackCommand;
        private readonly IPublishDefensePeriodScoresCommand _publishScoresCommand;
        private readonly IGetDefenseOverviewAnalyticsQuery _overviewQuery;
        private readonly IGetDefenseByCouncilAnalyticsQuery _byCouncilQuery;
        private readonly IGetDefenseDistributionAnalyticsQuery _distributionQuery;
        private readonly IGetScoringMatrixQuery _scoringMatrixQuery;
        private readonly IGetScoringProgressQuery _scoringProgressQuery;
        private readonly IGetScoringAlertsQuery _scoringAlertsQuery;
        private readonly IBuildDefenseReportQuery _reportQuery;
        private readonly IGetDefenseExportHistoryQuery _exportHistoryQuery;
        private readonly IGetDefensePublishHistoryQuery _publishHistoryQuery;
        private readonly IGetCouncilAuditHistoryQuery _councilAuditHistoryQuery;
        private readonly IGetRevisionAuditTrailQuery _revisionAuditTrailQuery;

        public DefensePeriodsController(
            Services.IUnitOfWork uow,
            Services.ICodeGenerator codeGen,
            AutoMapper.IMapper mapper,
            ISyncDefensePeriodCommand syncCommand,
            IGetDefensePeriodStudentsQuery getStudentsQuery,
            IGetDefensePeriodConfigQuery getConfigQuery,
            IGetDefensePeriodStateQuery getStateQuery,
            IGetRollbackAvailabilityQuery getRollbackAvailabilityQuery,
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
            IGetTopicTagsQueryV2 getTopicTagsQuery,
            IGetLecturerTagsQueryV2 getLecturerTagsQuery,
            IGetCommitteeTagsQueryV2 getCommitteeTagsQuery,
            IGetDefenseTagOverviewQueryV2 getDefenseTagOverviewQuery,
            IGetCouncilCalendarQuery getCouncilCalendarQuery,
            ICreateCouncilCommand createCouncilCommand,
            IUpdateCouncilCommand updateCouncilCommand,
            IDeleteCouncilCommand deleteCouncilCommand,
            IGenerateCouncilCodeCommand generateCouncilCodeCommand,
            ICreateCouncilStep1Command createCouncilStep1Command,
            IUpdateCouncilStep1Command updateCouncilStep1Command,
            ISaveCouncilMembersStepCommand saveCouncilMembersStepCommand,
            ISaveCouncilTopicsStepCommand saveCouncilTopicsStepCommand,
            IAddCouncilMemberItemCommand addCouncilMemberItemCommand,
            IUpdateCouncilMemberItemCommand updateCouncilMemberItemCommand,
            IRemoveCouncilMemberItemCommand removeCouncilMemberItemCommand,
            IAddCouncilTopicItemCommand addCouncilTopicItemCommand,
            IUpdateCouncilTopicItemCommand updateCouncilTopicItemCommand,
            IRemoveCouncilTopicItemCommand removeCouncilTopicItemCommand,
            IFinalizeDefensePeriodCommand finalizeCommand,
            IRollbackDefensePeriodCommand rollbackCommand,
            IPublishDefensePeriodScoresCommand publishScoresCommand,
            IGetDefenseOverviewAnalyticsQuery overviewQuery,
            IGetDefenseByCouncilAnalyticsQuery byCouncilQuery,
            IGetDefenseDistributionAnalyticsQuery distributionQuery,
            IGetScoringMatrixQuery scoringMatrixQuery,
            IGetScoringProgressQuery scoringProgressQuery,
            IGetScoringAlertsQuery scoringAlertsQuery,
            IBuildDefenseReportQuery reportQuery,
            IGetDefenseExportHistoryQuery exportHistoryQuery,
            IGetDefensePublishHistoryQuery publishHistoryQuery,
            IGetCouncilAuditHistoryQuery councilAuditHistoryQuery,
            IGetRevisionAuditTrailQuery revisionAuditTrailQuery) : base(uow, codeGen, mapper)
        {
            _syncCommand = syncCommand;
            _getStudentsQuery = getStudentsQuery;
            _getConfigQuery = getConfigQuery;
            _getStateQuery = getStateQuery;
            _getRollbackAvailabilityQuery = getRollbackAvailabilityQuery;
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
            _getTopicTagsQuery = getTopicTagsQuery;
            _getLecturerTagsQuery = getLecturerTagsQuery;
            _getCommitteeTagsQuery = getCommitteeTagsQuery;
            _getDefenseTagOverviewQuery = getDefenseTagOverviewQuery;
            _getCouncilCalendarQuery = getCouncilCalendarQuery;
            _createCouncilCommand = createCouncilCommand;
            _updateCouncilCommand = updateCouncilCommand;
            _deleteCouncilCommand = deleteCouncilCommand;
            _generateCouncilCodeCommand = generateCouncilCodeCommand;
            _createCouncilStep1Command = createCouncilStep1Command;
            _updateCouncilStep1Command = updateCouncilStep1Command;
            _saveCouncilMembersStepCommand = saveCouncilMembersStepCommand;
            _saveCouncilTopicsStepCommand = saveCouncilTopicsStepCommand;
            _addCouncilMemberItemCommand = addCouncilMemberItemCommand;
            _updateCouncilMemberItemCommand = updateCouncilMemberItemCommand;
            _removeCouncilMemberItemCommand = removeCouncilMemberItemCommand;
            _addCouncilTopicItemCommand = addCouncilTopicItemCommand;
            _updateCouncilTopicItemCommand = updateCouncilTopicItemCommand;
            _removeCouncilTopicItemCommand = removeCouncilTopicItemCommand;
            _finalizeCommand = finalizeCommand;
            _rollbackCommand = rollbackCommand;
            _publishScoresCommand = publishScoresCommand;
            _overviewQuery = overviewQuery;
            _byCouncilQuery = byCouncilQuery;
            _distributionQuery = distributionQuery;
            _scoringMatrixQuery = scoringMatrixQuery;
            _scoringProgressQuery = scoringProgressQuery;
            _scoringAlertsQuery = scoringAlertsQuery;
            _reportQuery = reportQuery;
            _exportHistoryQuery = exportHistoryQuery;
            _publishHistoryQuery = publishHistoryQuery;
            _councilAuditHistoryQuery = councilAuditHistoryQuery;
            _revisionAuditTrailQuery = revisionAuditTrailQuery;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<IEnumerable<DefensePeriodListItemDto>>>> GetPeriods(
            [FromQuery] string? keyword = null,
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _uow.DefenseTerms.Query().AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var normalizedKeyword = keyword.Trim().ToUpperInvariant();
                query = query.Where(x => x.Name.ToUpper().Contains(normalizedKeyword));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = NormalizePeriodStatus(status);
                query = query.Where(x => x.Status == normalizedStatus);
            }

            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 200);
            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.StartDate)
                .ThenByDescending(x => x.DefenseTermId)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(x => new DefensePeriodListItemDto
                {
                    DefenseTermId = x.DefenseTermId,
                    Name = x.Name,
                    StartDate = x.StartDate,
                    EndDate = x.EndDate,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt,
                    LastUpdated = x.LastUpdated
                })
                .ToListAsync();

            return Ok(ApiResponse<IEnumerable<DefensePeriodListItemDto>>.SuccessResponse(items, total));
        }

        [HttpGet("{periodId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodDetailDto>>> GetPeriodDetail(int periodId)
        {
            var period = await _uow.DefenseTerms.Query().AsNoTracking().FirstOrDefaultAsync(x => x.DefenseTermId == periodId);
            if (period == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy đợt bảo vệ.", 404));
            }

            var councilIds = LoadCouncilIdsFromConfig(period.ConfigJson);
            var councilCount = councilIds.Count;
            var assignmentCount = 0;
            var resultCount = 0;
            var revisionCount = 0;

            if (councilIds.Count > 0)
            {
                assignmentCount = await _uow.DefenseAssignments.Query()
                    .AsNoTracking()
                    .Where(x => x.CommitteeID.HasValue && councilIds.Contains(x.CommitteeID.Value))
                    .CountAsync();

                var assignmentIds = await _uow.DefenseAssignments.Query()
                    .AsNoTracking()
                    .Where(x => x.CommitteeID.HasValue && councilIds.Contains(x.CommitteeID.Value))
                    .Select(x => x.AssignmentID)
                    .ToListAsync();

                if (assignmentIds.Count > 0)
                {
                    resultCount = await _uow.DefenseResults.Query()
                        .AsNoTracking()
                        .Where(x => assignmentIds.Contains(x.AssignmentId))
                        .CountAsync();

                    revisionCount = await _uow.DefenseRevisions.Query()
                        .AsNoTracking()
                        .Where(x => assignmentIds.Contains(x.AssignmentId))
                        .CountAsync();
                }
            }

            var configResult = await _getConfigQuery.ExecuteAsync(periodId);
            var stateResult = await _getStateQuery.ExecuteAsync(periodId);

            var dto = new DefensePeriodDetailDto
            {
                DefenseTermId = period.DefenseTermId,
                Name = period.Name,
                StartDate = period.StartDate,
                EndDate = period.EndDate,
                Status = period.Status,
                CreatedAt = period.CreatedAt,
                LastUpdated = period.LastUpdated,
                CouncilCount = councilCount,
                AssignmentCount = assignmentCount,
                ResultCount = resultCount,
                RevisionCount = revisionCount,
                Config = configResult.Success ? configResult.Data : null,
                State = stateResult.Success ? stateResult.Data : null
            };

            return Ok(ApiResponse<DefensePeriodDetailDto>.SuccessResponse(dto));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodDetailDto>>> CreatePeriod([FromBody] DefensePeriodCreateDto request)
        {
            try
            {
                ValidatePeriodWindow(request.StartDate, request.EndDate);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }

            string normalizedStatus;
            try
            {
                normalizedStatus = NormalizePeriodStatus(string.IsNullOrWhiteSpace(request.Status) ? "Draft" : request.Status);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }

            var duplicatedName = await _uow.DefenseTerms.Query().AsNoTracking()
                .AnyAsync(x => x.Name.ToUpper() == request.Name.Trim().ToUpper());
            if (duplicatedName)
            {
                return Conflict(ApiResponse<object>.Fail("Tên đợt bảo vệ đã tồn tại.", 409));
            }

            var now = DateTime.UtcNow;
            var period = new Models.DefenseTerm
            {
                Name = request.Name.Trim(),
                StartDate = request.StartDate.Date,
                EndDate = request.EndDate?.Date,
                Status = normalizedStatus,
                CreatedAt = now,
                LastUpdated = now
            };

            await _uow.DefenseTerms.AddAsync(period);
            await _uow.SaveChangesAsync();

            var dto = new DefensePeriodDetailDto
            {
                DefenseTermId = period.DefenseTermId,
                Name = period.Name,
                StartDate = period.StartDate,
                EndDate = period.EndDate,
                Status = period.Status,
                CreatedAt = period.CreatedAt,
                LastUpdated = period.LastUpdated,
                CouncilCount = 0,
                AssignmentCount = 0,
                ResultCount = 0,
                RevisionCount = 0
            };

            return StatusCode(201, ApiResponse<DefensePeriodDetailDto>.SuccessResponse(dto, 1, 201));
        }

        [HttpPut("{periodId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodDetailDto>>> UpdatePeriod(int periodId, [FromBody] DefensePeriodUpdateDto request)
        {
            try
            {
                ValidatePeriodWindow(request.StartDate, request.EndDate);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }

            string normalizedStatus;
            try
            {
                normalizedStatus = NormalizePeriodStatus(string.IsNullOrWhiteSpace(request.Status) ? "Draft" : request.Status);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
            }

            var period = await _uow.DefenseTerms.GetByIdAsync(periodId);
            if (period == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy đợt bảo vệ.", 404));
            }

            var duplicatedName = await _uow.DefenseTerms.Query().AsNoTracking()
                .AnyAsync(x => x.DefenseTermId != periodId && x.Name.ToUpper() == request.Name.Trim().ToUpper());
            if (duplicatedName)
            {
                return Conflict(ApiResponse<object>.Fail("Tên đợt bảo vệ đã tồn tại.", 409));
            }

            period.Name = request.Name.Trim();
            period.StartDate = request.StartDate.Date;
            period.EndDate = request.EndDate?.Date;
            period.Status = normalizedStatus;
            period.LastUpdated = DateTime.UtcNow;

            _uow.DefenseTerms.Update(period);
            await _uow.SaveChangesAsync();

            var councilIds = LoadCouncilIdsFromConfig(period.ConfigJson);
            var assignmentCount = 0;
            var resultCount = 0;
            var revisionCount = 0;

            if (councilIds.Count > 0)
            {
                assignmentCount = await _uow.DefenseAssignments.Query()
                    .AsNoTracking()
                    .Where(x => x.CommitteeID.HasValue && councilIds.Contains(x.CommitteeID.Value))
                    .CountAsync();

                var assignmentIds = await _uow.DefenseAssignments.Query()
                    .AsNoTracking()
                    .Where(x => x.CommitteeID.HasValue && councilIds.Contains(x.CommitteeID.Value))
                    .Select(x => x.AssignmentID)
                    .ToListAsync();

                if (assignmentIds.Count > 0)
                {
                    resultCount = await _uow.DefenseResults.Query()
                        .AsNoTracking()
                        .Where(x => assignmentIds.Contains(x.AssignmentId))
                        .CountAsync();

                    revisionCount = await _uow.DefenseRevisions.Query()
                        .AsNoTracking()
                        .Where(x => assignmentIds.Contains(x.AssignmentId))
                        .CountAsync();
                }
            }

            var configResult = await _getConfigQuery.ExecuteAsync(periodId);
            var stateResult = await _getStateQuery.ExecuteAsync(periodId);

            var dto = new DefensePeriodDetailDto
            {
                DefenseTermId = period.DefenseTermId,
                Name = period.Name,
                StartDate = period.StartDate,
                EndDate = period.EndDate,
                Status = period.Status,
                CreatedAt = period.CreatedAt,
                LastUpdated = period.LastUpdated,
                CouncilCount = councilIds.Count,
                AssignmentCount = assignmentCount,
                ResultCount = resultCount,
                RevisionCount = revisionCount,
                Config = configResult.Success ? configResult.Data : null,
                State = stateResult.Success ? stateResult.Data : null
            };

            return Ok(ApiResponse<DefensePeriodDetailDto>.SuccessResponse(dto));
        }

        [HttpDelete("{periodId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<object>>> DeletePeriod(int periodId)
        {
            var period = await _uow.DefenseTerms.GetByIdAsync(periodId);
            if (period == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy đợt bảo vệ.", 404));
            }

            var councilIds = LoadCouncilIdsFromConfig(period.ConfigJson);
            if (councilIds.Count > 0)
            {
                var hasAssignments = await _uow.DefenseAssignments.Query()
                    .AsNoTracking()
                    .AnyAsync(x => x.CommitteeID.HasValue && councilIds.Contains(x.CommitteeID.Value));

                if (hasAssignments)
                {
                    return Conflict(ApiResponse<object>.Fail("Đợt đã phát sinh phân công bảo vệ, không thể xóa.", 409));
                }

                var hasCommittees = await _uow.Committees.Query().AsNoTracking().AnyAsync(x => councilIds.Contains(x.CommitteeID));
                if (hasCommittees)
                {
                    return Conflict(ApiResponse<object>.Fail("Đợt đã phát sinh hội đồng, không thể xóa.", 409));
                }
            }

            _uow.DefenseTerms.Remove(period);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        [HttpPost("{periodId:int}/sync")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<SyncDefensePeriodResponseDto>>> Sync(int periodId, [FromBody] SyncDefensePeriodRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _syncCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/students")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<EligibleStudentDto>>>> GetStudents(int periodId, [FromQuery] bool eligible = true)
        {
            var result = await _getStudentsQuery.ExecuteAsync(periodId, eligible);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/eligible-topics")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<EligibleStudentDto>>>> GetEligibleTopics(int periodId, [FromQuery] bool eligibleOnly = true)
        {
            var result = await _getStudentsQuery.ExecuteAsync(periodId, eligibleOnly);
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

        [HttpGet("{periodId:int}/readiness-check")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodStateDto>>> GetReadinessCheck(int periodId)
        {
            var result = await _getStateQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/rollback/availability")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<RollbackAvailabilityDto>>> GetRollbackAvailability(int periodId)
        {
            var result = await _getRollbackAvailabilityQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/sync/errors")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<SyncErrorDetailDto>>>> GetSyncErrors(int periodId)
        {
            var result = await _getSyncErrorsQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/eligibility-errors")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<SyncErrorDetailDto>>>> GetEligibilityErrors(int periodId)
        {
            var result = await _getSyncErrorsQuery.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/sync-history")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilAuditHistoryDto>>>> GetSyncHistory(int periodId, [FromQuery] int size = 100)
        {
            var limit = Math.Clamp(size, 1, 500);
            var periodToken = $"period={periodId}";
            var rows = await _uow.SyncAuditLogs.Query().AsNoTracking()
                .Where(x => x.Records.Contains(periodToken) || x.Action.Contains("SYNC"))
                .OrderByDescending(x => x.Timestamp)
                .Take(limit)
                .Select(x => new CouncilAuditHistoryDto
                {
                    SyncAuditLogId = x.SyncAuditLogId,
                    Action = x.Action,
                    Result = x.Result,
                    Records = x.Records,
                    Timestamp = x.Timestamp
                })
                .ToListAsync();

            return Ok(ApiResponse<List<CouncilAuditHistoryDto>>.SuccessResponse(rows, code: "UC1.SYNC_HISTORY.SUCCESS"));
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
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/lecturer-capabilities/lock")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> LockLecturerCapabilities(int periodId)
        {
            var result = await _lockCapabilitiesCommand.ExecuteAsync(periodId, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/council-config/confirm")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> ConfirmCouncilConfig(int periodId, [FromBody] ConfirmCouncilConfigDto request)
        {
            var result = await _confirmCouncilConfigCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils/generate")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilDraftDto>>>> GenerateCouncils(int periodId, [FromBody] GenerateCouncilsRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _generateCouncilsCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/committees/auto-generate")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CouncilDraftDto>>>> AutoGenerateCommittees(int periodId, [FromBody] GenerateCouncilsRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _generateCouncilsCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/auto-generate/config")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<AutoGenerateConfigDto>>> GetAutoGenerateConfig(int periodId)
        {
            var configResult = await _getConfigQuery.ExecuteAsync(periodId);
            if (!configResult.Success || configResult.Data == null)
            {
                return StatusCode(configResult.HttpStatusCode == 0 ? 400 : configResult.HttpStatusCode, ApiResponse<AutoGenerateConfigDto>.Fail(configResult.Message ?? "Không lấy được cấu hình.", configResult.HttpStatusCode == 0 ? 400 : configResult.HttpStatusCode, configResult.Errors, code: configResult.Code));
            }

            var stateResult = await _getStateQuery.ExecuteAsync(periodId);
            if (!stateResult.Success || stateResult.Data == null)
            {
                return StatusCode(stateResult.HttpStatusCode == 0 ? 400 : stateResult.HttpStatusCode, ApiResponse<AutoGenerateConfigDto>.Fail(stateResult.Message ?? "Không lấy được trạng thái.", stateResult.HttpStatusCode == 0 ? 400 : stateResult.HttpStatusCode, stateResult.Errors, code: stateResult.Code));
            }

            var roomCodes = await _uow.Rooms.Query().AsNoTracking().OrderBy(x => x.RoomCode).Select(x => x.RoomCode).ToListAsync();
            var availableRooms = roomCodes.Count > 0 ? roomCodes : configResult.Data.Rooms;

            var canGenerate = stateResult.Data.LecturerCapabilitiesLocked
                && stateResult.Data.CouncilConfigConfirmed
                && !stateResult.Data.Finalized
                && availableRooms.Count > 0;

            var warnings = new List<string>();
            if (!stateResult.Data.LecturerCapabilitiesLocked)
            {
                warnings.Add("UC2.READINESS.LECTURER_CAPABILITIES_UNLOCKED");
            }

            if (!stateResult.Data.CouncilConfigConfirmed)
            {
                warnings.Add("UC2.READINESS.COUNCIL_CONFIG_NOT_CONFIRMED");
            }

            if (stateResult.Data.Finalized)
            {
                warnings.Add("UC2.READINESS.PERIOD_FINALIZED");
            }

            if (availableRooms.Count == 0)
            {
                warnings.Add("UC2.READINESS.NO_ROOMS_AVAILABLE");
            }

            var response = new AutoGenerateConfigDto
            {
                AvailableRooms = availableRooms,
                DefaultSelectedRooms = availableRooms,
                SoftMaxCapacity = configResult.Data.SoftMaxCapacity,
                TopicsPerSession = configResult.Data.TopicsPerSessionConfig,
                MembersPerCouncil = configResult.Data.MembersPerCouncilConfig,
                LecturerCapabilitiesLocked = stateResult.Data.LecturerCapabilitiesLocked,
                CouncilConfigConfirmed = stateResult.Data.CouncilConfigConfirmed,
                Finalized = stateResult.Data.Finalized,
                ScoresPublished = stateResult.Data.ScoresPublished,
                CanGenerate = canGenerate,
                Warnings = warnings,
                DefaultHeuristicWeights = new GenerateCouncilHeuristicWeightsDto
                {
                    TagMatchWeight = 0.50m,
                    WorkloadWeight = 0.20m,
                    AvailabilityWeight = 0.15m,
                    FairnessWeight = 0.15m,
                    ConsecutiveCommitteePenaltyWeight = 0.20m
                }
            };

            return Ok(ApiResponse<AutoGenerateConfigDto>.SuccessResponse(
                response,
                code: "UC2.AUTO_GENERATE.CONFIG.SUCCESS",
                warnings: warnings.Select(x => new ApiWarning { Type = "soft", Code = x, Message = x }).ToList(),
                allowedActions: stateResult.Data.AllowedActions));
        }

        [HttpPost("{periodId:int}/auto-generate/simulate")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<AutoGenerateSimulationResultDto>>> SimulateAutoGenerate(int periodId, [FromBody] GenerateCouncilsRequestDto request)
        {
            var configResult = await _getConfigQuery.ExecuteAsync(periodId);
            if (!configResult.Success || configResult.Data == null)
            {
                return StatusCode(configResult.HttpStatusCode == 0 ? 400 : configResult.HttpStatusCode, ApiResponse<AutoGenerateSimulationResultDto>.Fail(configResult.Message ?? "Không lấy được cấu hình.", configResult.HttpStatusCode == 0 ? 400 : configResult.HttpStatusCode, configResult.Errors, code: configResult.Code));
            }

            var stateResult = await _getStateQuery.ExecuteAsync(periodId);
            if (!stateResult.Success || stateResult.Data == null)
            {
                return StatusCode(stateResult.HttpStatusCode == 0 ? 400 : stateResult.HttpStatusCode, ApiResponse<AutoGenerateSimulationResultDto>.Fail(stateResult.Message ?? "Không lấy được trạng thái.", stateResult.HttpStatusCode == 0 ? 400 : stateResult.HttpStatusCode, stateResult.Errors, code: stateResult.Code));
            }

            var selectedRooms = request.SelectedRooms
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (selectedRooms.Count == 0)
            {
                var dbRooms = await _uow.Rooms.Query().AsNoTracking().OrderBy(x => x.RoomCode).Select(x => x.RoomCode).ToListAsync();
                selectedRooms = dbRooms.Count > 0 ? dbRooms : configResult.Data.Rooms;
            }

            var eligibleStudentsResult = await _getStudentsQuery.ExecuteAsync(periodId, eligibleOnly: true);
            if (!eligibleStudentsResult.Success || eligibleStudentsResult.Data == null)
            {
                return StatusCode(
                    eligibleStudentsResult.HttpStatusCode == 0 ? 400 : eligibleStudentsResult.HttpStatusCode,
                    ApiResponse<AutoGenerateSimulationResultDto>.Fail(
                        eligibleStudentsResult.Message ?? "Không lấy được danh sách đề tài đủ điều kiện.",
                        eligibleStudentsResult.HttpStatusCode == 0 ? 400 : eligibleStudentsResult.HttpStatusCode,
                        eligibleStudentsResult.Errors,
                        code: eligibleStudentsResult.Code));
            }

            var eligibleTopics = eligibleStudentsResult.Data.Count;

            var topicsPerSession = request.Strategy?.MaxPerSession > 0 ? request.Strategy.MaxPerSession : configResult.Data.TopicsPerSessionConfig;
            var estimatedCapacity = selectedRooms.Count * 2 * topicsPerSession;
            var estimatedAssigned = Math.Min(eligibleTopics, estimatedCapacity);
            var coveragePercent = eligibleTopics == 0 ? 100m : Math.Round((decimal)estimatedAssigned * 100m / eligibleTopics, 2);

            var canGenerate = stateResult.Data.LecturerCapabilitiesLocked
                && stateResult.Data.CouncilConfigConfirmed
                && !stateResult.Data.Finalized
                && selectedRooms.Count > 0;

            var warnings = new List<string>();
            if (!stateResult.Data.LecturerCapabilitiesLocked)
            {
                warnings.Add("UC2.READINESS.LECTURER_CAPABILITIES_UNLOCKED");
            }

            if (!stateResult.Data.CouncilConfigConfirmed)
            {
                warnings.Add("UC2.READINESS.COUNCIL_CONFIG_NOT_CONFIRMED");
            }

            if (selectedRooms.Count == 0)
            {
                warnings.Add("UC2.READINESS.NO_ROOMS_AVAILABLE");
            }

            if (estimatedCapacity < eligibleTopics)
            {
                warnings.Add("UC2.SIMULATION.CAPACITY_INSUFFICIENT");
            }

            var explainability = new List<string>
            {
                $"Input rooms={selectedRooms.Count}; topicsPerSession={topicsPerSession}; sessionsPerRoom=2",
                $"Eligible topics={eligibleTopics}; estimatedCapacity={estimatedCapacity}; estimatedAssigned={estimatedAssigned}",
                $"Coverage={coveragePercent}%"
            };

            if (request.Strategy?.HeuristicWeights != null)
            {
                explainability.Add($"Weights: tag={request.Strategy.HeuristicWeights.TagMatchWeight ?? 0.50m}, workload={request.Strategy.HeuristicWeights.WorkloadWeight ?? 0.20m}, availability={request.Strategy.HeuristicWeights.AvailabilityWeight ?? 0.15m}, fairness={request.Strategy.HeuristicWeights.FairnessWeight ?? 0.15m}, consecutivePenalty={request.Strategy.HeuristicWeights.ConsecutiveCommitteePenaltyWeight ?? 0.20m}");
            }

            var status = !canGenerate
                ? "failure"
                : (warnings.Count > 0 ? "success-with-warning" : "success");

            var response = new AutoGenerateSimulationResultDto
            {
                Status = status,
                CanGenerate = canGenerate,
                AllowedActions = stateResult.Data.AllowedActions,
                Warnings = warnings,
                Explainability = explainability,
                Coverage = new AutoGenerateCoverageStatsDto
                {
                    EligibleTopics = eligibleTopics,
                    EstimatedCapacity = estimatedCapacity,
                    EstimatedAssigned = estimatedAssigned,
                    CoveragePercent = coveragePercent
                }
            };

            return Ok(ApiResponse<AutoGenerateSimulationResultDto>.SuccessResponse(
                response,
                code: "UC2.AUTO_GENERATE.SIMULATION.SUCCESS",
                warnings: warnings.Select(x => new ApiWarning { Type = "soft", Code = x, Message = x }).ToList(),
                allowedActions: stateResult.Data.AllowedActions));
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

        [HttpGet("{periodId:int}/councils/calendar")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<DefensePeriodCalendarDayDto>>>> GetCouncilCalendar(int periodId, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            var result = await _getCouncilCalendarQuery.ExecuteAsync(periodId, fromDate, toDate);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/councils/{councilId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> GetCouncilDetail(int periodId, int councilId)
        {
            var result = await _getCouncilDetailQuery.ExecuteAsync(periodId, councilId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/tags/topics")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<TopicTagUsageDto>>>> GetTopicTags(int periodId, [FromQuery] string? tagCode = null)
        {
            var result = await _getTopicTagsQuery.ExecuteAsync(periodId, tagCode);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/tags/lecturers")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<LecturerTagUsageDto>>>> GetLecturerTags(int periodId, [FromQuery] string? tagCode = null)
        {
            var result = await _getLecturerTagsQuery.ExecuteAsync(periodId, tagCode);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/tags/committees")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<CommitteeTagUsageDto>>>> GetCommitteeTags(int periodId, [FromQuery] string? tagCode = null)
        {
            var result = await _getCommitteeTagsQuery.ExecuteAsync(periodId, tagCode);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/tags/overview")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<DefensePeriodTagOverviewDto>>> GetTagOverview(int periodId)
        {
            var result = await _getDefenseTagOverviewQuery.ExecuteAsync(periodId);
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

        [HttpGet("{periodId:int}/councils/auto-code")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<GenerateCouncilCodeResponseDto>>> GenerateCouncilCode(int periodId)
        {
            var result = await _generateCouncilCodeCommand.ExecuteAsync(periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils/workflow/step1")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> CreateCouncilStep1(int periodId, [FromBody] CouncilWorkflowStep1Dto request)
        {
            var result = await _createCouncilStep1Command.ExecuteAsync(periodId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 201 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}/workflow/step1")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> UpdateCouncilStep1(int periodId, int councilId, [FromBody] CouncilWorkflowStep1Dto request)
        {
            var result = await _updateCouncilStep1Command.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}/workflow/step2-members")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> SaveCouncilMembersStep(int periodId, int councilId, [FromBody] CouncilWorkflowStep2Dto request)
        {
            var result = await _saveCouncilMembersStepCommand.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils/{councilId:int}/members")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> AddCouncilMemberItem(int periodId, int councilId, [FromBody] AddCouncilMemberItemDto request)
        {
            var result = await _addCouncilMemberItemCommand.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}/members/{lecturerCode}")]
        [HttpPatch("{periodId:int}/councils/{councilId:int}/members/{lecturerCode}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> UpdateCouncilMemberItem(int periodId, int councilId, string lecturerCode, [FromBody] UpdateCouncilMemberItemDto request)
        {
            var result = await _updateCouncilMemberItemCommand.ExecuteAsync(periodId, councilId, lecturerCode, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpDelete("{periodId:int}/councils/{councilId:int}/members/{lecturerCode}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> RemoveCouncilMemberItem(int periodId, int councilId, string lecturerCode, [FromQuery] string concurrencyToken)
        {
            var request = new RemoveCouncilMemberItemDto { ConcurrencyToken = concurrencyToken };
            var result = await _removeCouncilMemberItemCommand.ExecuteAsync(periodId, councilId, lecturerCode, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}/workflow/step3-topics")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> SaveCouncilTopicsStep(int periodId, int councilId, [FromBody] CouncilWorkflowStep3Dto request)
        {
            var result = await _saveCouncilTopicsStepCommand.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/councils/{councilId:int}/topics")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> AddCouncilTopicItem(int periodId, int councilId, [FromBody] AddCouncilTopicItemDto request)
        {
            var result = await _addCouncilTopicItemCommand.ExecuteAsync(periodId, councilId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("{periodId:int}/councils/{councilId:int}/topics/{assignmentId:int}")]
        [HttpPatch("{periodId:int}/councils/{councilId:int}/topics/{assignmentId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> UpdateCouncilTopicItem(int periodId, int councilId, int assignmentId, [FromBody] UpdateCouncilTopicItemDto request)
        {
            var result = await _updateCouncilTopicItemCommand.ExecuteAsync(periodId, councilId, assignmentId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpDelete("{periodId:int}/councils/{councilId:int}/topics/{assignmentId:int}")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<CouncilDraftDto>>> RemoveCouncilTopicItem(int periodId, int councilId, int assignmentId, [FromQuery] string concurrencyToken)
        {
            var request = new RemoveCouncilTopicItemDto { ConcurrencyToken = concurrencyToken };
            var result = await _removeCouncilTopicItemCommand.ExecuteAsync(periodId, councilId, assignmentId, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/finalize")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> FinalizePeriod(int periodId, [FromBody] FinalizeDefensePeriodDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _finalizeCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/rollback")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<RollbackDefensePeriodResponseDto>>> RollbackPeriod(int periodId, [FromBody] RollbackDefensePeriodDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            request.IdempotencyKey ??= idempotencyKey;
            var result = await _rollbackCommand.ExecuteAsync(periodId, request, CurrentUserId);
            await AttachPeriodStateMetadataAsync(periodId, result);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("{periodId:int}/publish-scores")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<bool>>> PublishScores(int periodId, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var result = await _publishScoresCommand.ExecuteAsync(periodId, CurrentUserId, idempotencyKey);
            await AttachPeriodStateMetadataAsync(periodId, result);
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

        [HttpGet("{periodId:int}/scoring/matrix")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<ScoringMatrixRowDto>>>> GetScoringMatrix(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringMatrixQuery.ExecuteAsync(periodId, committeeId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/scoring/progress")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<ScoringProgressDto>>>> GetScoringProgress(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringProgressQuery.ExecuteAsync(periodId, committeeId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("{periodId:int}/scoring/alerts")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<ScoringAlertDto>>>> GetScoringAlerts(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringAlertsQuery.ExecuteAsync(periodId, committeeId);
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

        [HttpGet("{periodId:int}/revisions/{revisionId:int}/audit-trail")]
        [Authorize(Roles = "Admin,Head")]
        public async Task<ActionResult<ApiResponse<List<RevisionAuditTrailDto>>>> GetRevisionAuditTrail(int periodId, int revisionId)
        {
            var result = await _revisionAuditTrailQuery.ExecuteAsync(periodId, revisionId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        private async Task AttachPeriodStateMetadataAsync<T>(int periodId, ApiResponse<T> response)
        {
            var stateResult = await _getStateQuery.ExecuteAsync(periodId);
            if (!stateResult.Success || stateResult.Data == null)
            {
                return;
            }

            response.AllowedActions = stateResult.Data.AllowedActions ?? new List<string>();

            var warningCodeSet = response.Warnings
                .Select(x => x.Code)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var warningCode in stateResult.Data.Warnings)
            {
                if (warningCodeSet.Contains(warningCode))
                {
                    continue;
                }

                response.Warnings.Add(new ApiWarning
                {
                    Type = "soft",
                    Code = warningCode,
                    Message = warningCode
                });
            }
        }

        private static void ValidatePeriodWindow(DateTime startDate, DateTime? endDate)
        {
            if (endDate.HasValue && endDate.Value.Date < startDate.Date)
            {
                throw new ArgumentException("EndDate phải lớn hơn hoặc bằng StartDate.");
            }
        }

        private static string NormalizePeriodStatus(string status)
        {
            var normalized = status.Trim().ToUpperInvariant();
            return normalized switch
            {
                "DRAFT" => "Draft",
                "PREPARING" => "Preparing",
                "FINALIZED" => "Finalized",
                "PUBLISHED" => "Published",
                "ARCHIVED" => "Archived",
                _ => throw new ArgumentException("Status chỉ hỗ trợ: Draft, Preparing, Finalized, Published, Archived.")
            };
        }

        private static HashSet<int> LoadCouncilIdsFromConfig(string? configJson)
        {
            if (string.IsNullOrWhiteSpace(configJson))
            {
                return new HashSet<int>();
            }

            try
            {
                using var doc = JsonDocument.Parse(configJson);
                if (!doc.RootElement.TryGetProperty("CouncilIds", out var councilIdsElement)
                    || councilIdsElement.ValueKind != JsonValueKind.Array)
                {
                    return new HashSet<int>();
                }

                var ids = new HashSet<int>();
                foreach (var item in councilIdsElement.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var id))
                    {
                        ids.Add(id);
                    }
                }

                return ids;
            }
            catch
            {
                return new HashSet<int>();
            }
        }
    }
}

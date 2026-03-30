using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using System.Globalization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Common.Heuristics;
using ThesisManagement.Api.Application.Common.Resilience;
using ThesisManagement.Api.Application.Command.DefensePeriods.Services;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefensePeriods
{
    public interface IDefensePeriodCommandProcessor
    {
        Task<ApiResponse<SyncDefensePeriodResponseDto>> SyncAsync(int periodId, SyncDefensePeriodRequestDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> UpdateConfigAsync(int periodId, UpdateDefensePeriodConfigDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> UpdateLecturerBusySlotsAsync(int periodId, string lecturerCode, UpdateLecturerBusySlotsDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> LockLecturerCapabilitiesAsync(int periodId, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> ConfirmCouncilConfigAsync(int periodId, ConfirmCouncilConfigDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<CouncilDraftDto>>> GenerateCouncilsAsync(int periodId, GenerateCouncilsRequestDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> CreateCouncilAsync(int periodId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> UpdateCouncilAsync(int periodId, int councilId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> DeleteCouncilAsync(int periodId, int councilId, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<GenerateCouncilCodeResponseDto>> GenerateCouncilCodeAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> CreateCouncilStep1Async(int periodId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> UpdateCouncilStep1Async(int periodId, int councilId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> SaveCouncilMembersStepAsync(int periodId, int councilId, CouncilWorkflowStep2Dto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> SaveCouncilTopicsStepAsync(int periodId, int councilId, CouncilWorkflowStep3Dto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> AddCouncilMemberItemAsync(int periodId, int councilId, AddCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> UpdateCouncilMemberItemAsync(int periodId, int councilId, string lecturerCode, UpdateCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> RemoveCouncilMemberItemAsync(int periodId, int councilId, string lecturerCode, RemoveCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> AddCouncilTopicItemAsync(int periodId, int councilId, AddCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> UpdateCouncilTopicItemAsync(int periodId, int councilId, int assignmentId, UpdateCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> RemoveCouncilTopicItemAsync(int periodId, int councilId, int assignmentId, RemoveCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> FinalizeAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<RollbackDefensePeriodResponseDto>> RollbackAsync(int periodId, RollbackDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> PublishScoresAsync(int periodId, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);

        Task<ApiResponse<bool>> SaveLecturerMinuteAsync(int committeeId, UpdateLecturerMinutesDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> SubmitIndependentScoreAsync(int committeeId, LecturerScoreSubmitDto request, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RequestReopenScoreAsync(int committeeId, ReopenScoreRequestDto request, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> LockSessionAsync(int committeeId, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);

        Task<ApiResponse<bool>> SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, string studentCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);
    }

    internal sealed class DefensePeriodConfigState
    {
        public List<string> Rooms { get; set; } = new();
        public string MorningStart { get; set; } = "07:30";
        public string AfternoonStart { get; set; } = "13:30";
        public int SoftMaxCapacity { get; set; } = 4;
        public bool LecturerCapabilitiesLocked { get; set; }
        public bool CouncilConfigConfirmed { get; set; }
        public bool Finalized { get; set; }
        public bool ScoresPublished { get; set; }
        public ConfirmCouncilConfigDto CouncilConfig { get; set; } = new();
        public List<int> CouncilIds { get; set; } = new();
    }

    public class DefensePeriodCommandProcessor : IDefensePeriodCommandProcessor
    {
        private sealed class RetryExecutionResult<T>
        {
            public T Data { get; init; } = default!;
            public int Attempts { get; init; }
        }

        private const int MinMembersPerCouncil = 3;
        private const int MaxMembersPerCouncil = 7;
        private const int MinTopicsPerSession = 3;
        private const int MaxTopicsPerSession = 7;
        private static readonly string[] AllowedAdditionalRoles = new[] { "PB", "UV" };
        private static readonly TimeSpan SessionDuration = TimeSpan.FromMinutes(60);
        private readonly ApplicationDbContext _db;
        private readonly IUnitOfWork _uow;
        private readonly IHubContext<ChatHub> _hub;
        private readonly ICommitteeConstraintService _constraintService;
        private readonly IDefenseCommitteeHeuristicService _heuristicService;
        private readonly IDefenseScoreWorkflowService _scoreWorkflowService;
        private readonly IDefenseRevisionWorkflowService _revisionWorkflowService;
        private readonly IDefenseAuditTrailService _auditTrailService;
        private readonly IDefenseResiliencePolicy _resiliencePolicy;

        public DefensePeriodCommandProcessor(
            ApplicationDbContext db,
            IUnitOfWork uow,
            IHubContext<ChatHub> hub,
            ICommitteeConstraintService constraintService,
            IDefenseCommitteeHeuristicService heuristicService,
            IDefenseScoreWorkflowService scoreWorkflowService,
            IDefenseRevisionWorkflowService revisionWorkflowService,
            IDefenseAuditTrailService auditTrailService,
            IDefenseResiliencePolicy resiliencePolicy)
        {
            _db = db;
            _uow = uow;
            _hub = hub;
            _constraintService = constraintService;
            _heuristicService = heuristicService;
            _scoreWorkflowService = scoreWorkflowService;
            _revisionWorkflowService = revisionWorkflowService;
            _auditTrailService = auditTrailService;
            _resiliencePolicy = resiliencePolicy;
        }

        public async Task<ApiResponse<SyncDefensePeriodResponseDto>> SyncAsync(int periodId, SyncDefensePeriodRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (await IsIdempotentReplayAsync("SYNC_INPUT", periodId, request.IdempotencyKey, cancellationToken))
            {
                return ApiResponse<SyncDefensePeriodResponseDto>.SuccessResponse(new SyncDefensePeriodResponseDto
                {
                    Message = "Idempotent replay detected. Existing sync request was already processed."
                }, idempotencyReplay: true, code: DefenseUcErrorCodes.Sync.Replay);
            }

            var period = await GetPeriodAsync(periodId, cancellationToken);
            if (period == null)
            {
                return Fail<SyncDefensePeriodResponseDto>("Không tìm thấy đợt bảo vệ", 404);
            }

            var periodConfig = ReadConfig(period);
            var periodBeforeState = new
            {
                periodConfig.Rooms,
                periodConfig.MorningStart,
                periodConfig.AfternoonStart,
                periodConfig.SoftMaxCapacity,
                periodConfig.CouncilIds,
                periodConfig.LecturerCapabilitiesLocked,
                periodConfig.CouncilConfigConfirmed,
                periodConfig.Finalized,
                periodConfig.ScoresPublished
            };

            try
            {
                var retryResult = await ExecuteWithRetryAsync(
                    async () => await _db.Topics.AsNoTracking().ToListAsync(cancellationToken),
                    request.RetryOnFailure,
                    cancellationToken);

                var topics = retryResult.Data;
                var eligibleTopicCodes = await LoadEligibleTopicCodesFromMilestonesAsync(topics, cancellationToken);
                var rowErrors = new List<SyncRowErrorDto>();
                foreach (var topic in topics)
                {
                    var errors = new List<string>();
                    if (string.IsNullOrWhiteSpace(topic.ProposerStudentCode))
                    {
                        errors.Add("Thiếu StudentCode");
                    }

                    if (string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode))
                    {
                        errors.Add("Thiếu SupervisorCode");
                    }

                    if (!eligibleTopicCodes.Contains(topic.TopicCode))
                    {
                        errors.Add("Topic chưa đạt milestone đủ điều kiện bảo vệ.");
                    }

                    if (errors.Count > 0)
                    {
                        rowErrors.Add(new SyncRowErrorDto
                        {
                            TopicCode = topic.TopicCode,
                            Errors = errors
                        });
                    }
                }

                var eligibleCount = topics.Count - rowErrors.Count;
                var invalidCount = rowErrors.Count;
                var snapshotVersion = $"period-{periodId}-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
                var errorBreakdown = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (var row in rowErrors)
                {
                    foreach (var err in row.Errors)
                    {
                        if (!errorBreakdown.ContainsKey(err))
                        {
                            errorBreakdown[err] = 0;
                        }

                        errorBreakdown[err]++;
                    }
                }

                var readiness = BuildSyncReadiness(periodConfig, eligibleCount);

                await AddAuditSnapshotAsync(
                    "SYNC_INPUT",
                    "SUCCESS",
                    periodBeforeState,
                    new
                    {
                        SnapshotVersion = snapshotVersion,
                        EligibleCount = eligibleCount,
                        InvalidCount = invalidCount,
                        Attempts = retryResult.Attempts,
                        Readiness = readiness,
                        ErrorBreakdown = errorBreakdown
                    },
                    new
                    {
                        PeriodId = periodId,
                        RowErrorSample = rowErrors.Take(100).ToList(),
                        Actor = actorUserId
                    },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<SyncDefensePeriodResponseDto>.SuccessResponse(new SyncDefensePeriodResponseDto
                {
                    TotalPulled = topics.Count,
                    EligibleCount = eligibleCount,
                    InvalidCount = invalidCount,
                    RetryAttempts = retryResult.Attempts,
                    SnapshotVersion = snapshotVersion,
                    Readiness = readiness,
                    ErrorBreakdown = errorBreakdown,
                    RowErrors = rowErrors,
                    Message = retryResult.Attempts > 1
                        ? $"Sync completed after {retryResult.Attempts} attempts."
                        : "Sync completed."
                }, code: DefenseUcErrorCodes.Sync.Success);
            }
            catch (OperationCanceledException)
            {
                await AddAuditSnapshotAsync(
                    "SYNC_INPUT",
                    "TIMEOUT",
                    periodBeforeState,
                    null,
                    new { PeriodId = periodId, Actor = actorUserId },
                    actorUserId,
                    CancellationToken.None);
                return Fail<SyncDefensePeriodResponseDto>("Sync timeout. Vui lòng thử lại.", 408, DefenseUcErrorCodes.Sync.Timeout);
            }
            catch (Exception ex)
            {
                await AddAuditSnapshotAsync(
                    "SYNC_INPUT",
                    "FAILED",
                    periodBeforeState,
                    null,
                    new { PeriodId = periodId, Actor = actorUserId, Error = ex.Message },
                    actorUserId,
                    CancellationToken.None);
                return Fail<SyncDefensePeriodResponseDto>("Sync thất bại. Vui lòng thử lại.", 500, DefenseUcErrorCodes.Sync.Failed);
            }
        }

        public async Task<ApiResponse<bool>> UpdateConfigAsync(int periodId, UpdateDefensePeriodConfigDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeState = new
                {
                    period.StartDate,
                    period.EndDate,
                    config.Rooms,
                    config.MorningStart,
                    config.AfternoonStart,
                    config.SoftMaxCapacity
                };

                var topicsPerSession = NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig);
                ValidatePeriodConfig(request, topicsPerSession);

                var nextStartDate = request.StartDate?.Date ?? period.StartDate.Date;
                var nextEndDate = request.EndDate?.Date ?? period.EndDate?.Date;
                ValidateDefensePeriodWindow(nextStartDate, nextEndDate);

                var existingCouncilDates = await _db.Committees.AsNoTracking()
                    .Where(x => config.CouncilIds.Contains(x.CommitteeID))
                    .Select(x => new { x.CommitteeID, x.CommitteeCode, x.DefenseDate })
                    .ToListAsync(cancellationToken);

                var invalidCouncil = existingCouncilDates.FirstOrDefault(x => !x.DefenseDate.HasValue || x.DefenseDate.Value.Date < nextStartDate || (nextEndDate.HasValue && x.DefenseDate.Value.Date > nextEndDate.Value));
                if (invalidCouncil != null)
                {
                    throw new BusinessRuleException(
                        "Khoảng ngày mới không bao phủ toàn bộ hội đồng hiện tại.",
                        "UC1.2.DATE_RANGE_CONFLICT",
                        new { invalidCouncil.CommitteeID, invalidCouncil.CommitteeCode, invalidCouncil.DefenseDate, nextStartDate, nextEndDate });
                }

                config.Rooms = request.Rooms.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                config.MorningStart = request.MorningStart;
                config.AfternoonStart = request.AfternoonStart;
                config.SoftMaxCapacity = request.SoftMaxCapacity;
                period.StartDate = nextStartDate;
                period.EndDate = nextEndDate;

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await AddAuditSnapshotAsync(
                    "UPDATE_PERIOD_CONFIG",
                    "SUCCESS",
                    beforeState,
                    new
                    {
                        period.StartDate,
                        period.EndDate,
                        config.Rooms,
                        config.MorningStart,
                        config.AfternoonStart,
                        config.SoftMaxCapacity
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC1.2"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> UpdateLecturerBusySlotsAsync(int periodId, string lecturerCode, UpdateLecturerBusySlotsDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                _ = await EnsurePeriodAsync(periodId, cancellationToken);

                if (string.IsNullOrWhiteSpace(lecturerCode))
                {
                    throw new BusinessRuleException("lecturerCode là bắt buộc.");
                }

                var lecturer = await _db.LecturerProfiles.FirstOrDefaultAsync(x => x.LecturerCode == lecturerCode, cancellationToken);
                if (lecturer == null)
                {
                    throw new BusinessRuleException("Không tìm thấy giảng viên.");
                }

                var normalizedSlots = request.BusySlots
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var existing = await _db.LecturerBusyTimes.Where(x => x.LecturerProfileId == lecturer.LecturerProfileID).ToListAsync(cancellationToken);
                var beforeSlots = existing
                    .Where(x => !string.IsNullOrWhiteSpace(x.Slot))
                    .Select(x => x.Slot!)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(x => x)
                    .ToList();
                if (existing.Count > 0)
                {
                    _db.LecturerBusyTimes.RemoveRange(existing);
                }

                foreach (var slot in normalizedSlots)
                {
                    await _uow.LecturerBusyTimes.AddAsync(new LecturerBusyTime
                    {
                        LecturerProfileId = lecturer.LecturerProfileID,
                        Slot = slot,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _uow.SaveChangesAsync();
                await AddAuditSnapshotAsync(
                    "UPDATE_LECTURER_BUSY_SLOTS",
                    "SUCCESS",
                    new { LecturerCode = lecturerCode, BusySlots = beforeSlots },
                    new { LecturerCode = lecturerCode, BusySlots = normalizedSlots },
                    new { PeriodId = periodId, SlotCount = normalizedSlots.Count },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC1.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> LockLecturerCapabilitiesAsync(int periodId, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeLocked = config.LecturerCapabilitiesLocked;
                config.LecturerCapabilitiesLocked = true;
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await AddAuditSnapshotAsync(
                    "LOCK_LECTURER_CAPABILITIES",
                    "SUCCESS",
                    new { LecturerCapabilitiesLocked = beforeLocked },
                    new { config.LecturerCapabilitiesLocked },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC1.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> ConfirmCouncilConfigAsync(int periodId, ConfirmCouncilConfigDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request.TopicsPerSessionConfig < MinTopicsPerSession || request.TopicsPerSessionConfig > MaxTopicsPerSession)
                {
                    throw new BusinessRuleException("topicsPerSessionConfig phải trong khoảng 3-7.");
                }

                if (request.MembersPerCouncilConfig < MinMembersPerCouncil || request.MembersPerCouncilConfig > MaxMembersPerCouncil)
                {
                    throw new BusinessRuleException("membersPerCouncilConfig phải trong khoảng 3-7.");
                }

                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeConfig = new
                {
                    config.CouncilConfigConfirmed,
                    config.CouncilConfig.TopicsPerSessionConfig,
                    config.CouncilConfig.MembersPerCouncilConfig,
                    config.CouncilConfig.Tags
                };
                config.CouncilConfig = request;
                config.CouncilConfigConfirmed = true;
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;

                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();
                await AddAuditSnapshotAsync(
                    "CONFIRM_COUNCIL_CONFIG",
                    "SUCCESS",
                    beforeConfig,
                    new
                    {
                        config.CouncilConfigConfirmed,
                        config.CouncilConfig.TopicsPerSessionConfig,
                        config.CouncilConfig.MembersPerCouncilConfig,
                        config.CouncilConfig.Tags
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.1"), ex.Details);
            }
        }

        public async Task<ApiResponse<List<CouncilDraftDto>>> GenerateCouncilsAsync(int periodId, GenerateCouncilsRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (await IsIdempotentReplayAsync("GENERATE_COUNCILS", periodId, request.IdempotencyKey, cancellationToken))
            {
                var periodState = await GetPeriodAsync(periodId, cancellationToken);
                if (periodState == null)
                {
                    return Fail<List<CouncilDraftDto>>("Không tìm thấy đợt bảo vệ", 404);
                }

                var configState = ReadConfig(periodState);
                var replayData = new List<CouncilDraftDto>();
                foreach (var councilId in configState.CouncilIds)
                {
                    replayData.Add(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
                }

                return ApiResponse<List<CouncilDraftDto>>.SuccessResponse(replayData, code: DefenseUcErrorCodes.Council.GenerateReplay, idempotencyReplay: true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeCouncilIds = config.CouncilIds.ToList();
                if (config.Finalized)
                {
                    throw new BusinessRuleException("Đợt bảo vệ đã finalize, không thể generate lại hội đồng.");
                }

                if (!config.LecturerCapabilitiesLocked)
                {
                    throw new BusinessRuleException("Cần khóa capability giảng viên trước khi generate hội đồng.");
                }

                if (!config.CouncilConfigConfirmed)
                {
                    throw new BusinessRuleException("Cần xác nhận cấu hình hội đồng (UC 2.1) trước khi tạo hội đồng.");
                }

                var selectedRooms = request.SelectedRooms.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (selectedRooms.Count == 0)
                {
                    selectedRooms = config.Rooms;
                }

                if (selectedRooms.Count == 0)
                {
                    throw new BusinessRuleException("Cần chọn ít nhất 1 phòng trước khi generate hội đồng.");
                }

                var candidateTopics = await _db.Topics
                    .AsNoTracking()
                    .OrderBy(t => t.TopicCode)
                    .ToListAsync(cancellationToken);

                var eligibleTopicCodes = await LoadEligibleTopicCodesFromMilestonesAsync(candidateTopics, cancellationToken);
                var eligibleTopics = candidateTopics
                    .Where(t => eligibleTopicCodes.Contains(t.TopicCode))
                    .ToList();

                if (eligibleTopics.Count == 0)
                {
                    throw new BusinessRuleException("Không có đề tài đủ điều kiện để tạo hội đồng.");
                }

                var topicTags = await LoadTopicTagMapAsync(eligibleTopics.Select(t => t.TopicCode).ToList(), cancellationToken);
                var lecturers = await _db.LecturerProfiles
                    .AsNoTracking()
                    .Select(l => new
                    {
                        l.LecturerProfileID,
                        l.LecturerCode,
                        Name = l.FullName,
                        l.UserCode,
                        UserID = (int?)null
                    })
                    .ToListAsync(cancellationToken);

                var lecturerCodes = lecturers.Select(x => x.LecturerCode).ToList();
                var lecturerTagRows = await _db.LecturerTags
                    .AsNoTracking()
                    .Where(x => lecturerCodes.Contains(x.LecturerCode ?? string.Empty))
                    .Join(_db.Tags.AsNoTracking(), lt => lt.TagID, tg => tg.TagID, (lt, tg) => new { lt.LecturerCode, tg.TagCode })
                    .ToListAsync(cancellationToken);

                var lecturerTagMap = lecturerTagRows
                    .Where(x => !string.IsNullOrWhiteSpace(x.LecturerCode))
                    .GroupBy(x => x.LecturerCode!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase),
                        StringComparer.OrdinalIgnoreCase);

                var historicalWorkloadRows = await _db.CommitteeMembers
                    .AsNoTracking()
                    .Where(x => x.MemberLecturerCode != null)
                    .Select(x => x.MemberLecturerCode!)
                    .ToListAsync(cancellationToken);

                var historicalWorkloadMap = historicalWorkloadRows
                    .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

                var busySlotRows = await _db.LecturerBusyTimes
                    .AsNoTracking()
                    .Join(
                        _db.LecturerProfiles.AsNoTracking(),
                        bt => bt.LecturerProfileId,
                        lp => lp.LecturerProfileID,
                        (bt, lp) => new { lp.LecturerCode, bt.Slot })
                    .Where(x => x.LecturerCode != null)
                    .ToListAsync(cancellationToken);

                var busySlotMap = busySlotRows
                    .Where(x => !string.IsNullOrWhiteSpace(x.LecturerCode))
                    .GroupBy(x => x.LecturerCode!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

                var runtimeWorkloadMap = new Dictionary<string, int>(historicalWorkloadMap, StringComparer.OrdinalIgnoreCase);
                var runtimeConsecutiveCommitteeMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

                var previousCouncilIds = config.CouncilIds.ToHashSet();
                if (previousCouncilIds.Count > 0)
                {
                    var previousAssignments = await _db.DefenseAssignments.Where(x => x.CommitteeID.HasValue && previousCouncilIds.Contains(x.CommitteeID.Value)).ToListAsync(cancellationToken);
                    var previousMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID.HasValue && previousCouncilIds.Contains(x.CommitteeID.Value)).ToListAsync(cancellationToken);
                    var previousTags = await _db.CommitteeTags.Where(x => previousCouncilIds.Contains(x.CommitteeID)).ToListAsync(cancellationToken);
                    var previousCommittees = await _db.Committees.Where(x => previousCouncilIds.Contains(x.CommitteeID)).ToListAsync(cancellationToken);

                    _db.DefenseAssignments.RemoveRange(previousAssignments);
                    _db.CommitteeMembers.RemoveRange(previousMembers);
                    _db.CommitteeTags.RemoveRange(previousTags);
                    _db.Committees.RemoveRange(previousCommittees);
                }

                config.CouncilIds = new List<int>();

                var requestTags = request.Tags.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var configuredTags = config.CouncilConfig.Tags.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var preferredTags = requestTags.Count > 0 ? requestTags : configuredTags;
                var topics = preferredTags.Count == 0
                    ? eligibleTopics
                    : eligibleTopics.OrderByDescending(t => topicTags.TryGetValue(t.TopicCode, out var set) && set.Any(preferredTags.Contains)).ThenBy(t => t.TopicCode).ToList();

                var councils = new List<CouncilDraftDto>();
                var now = DateTime.UtcNow;
                var roomIndex = 0;
                var councilIndex = 1;
                var tagEntities = await _db.Tags.AsNoTracking().ToListAsync(cancellationToken);

                var topicsPerSession = NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig);
                var membersPerCouncil = NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig);
                var topicsPerCouncil = topicsPerSession * 2;

                for (var i = 0; i < topics.Count; i += topicsPerCouncil)
                {
                    var chunk = topics.Skip(i).Take(topicsPerCouncil).ToList();
                    if (chunk.Count < topicsPerCouncil)
                    {
                        break;
                    }

                    var room = selectedRooms[roomIndex % selectedRooms.Count];
                    roomIndex++;

                    var generatedCode = await GenerateUniqueCommitteeCodeAsync(periodId, request.IdempotencyKey, cancellationToken);
                    var committee = new Committee
                    {
                        CommitteeCode = generatedCode,
                        Name = $"Hội đồng {councilIndex}",
                        DefenseDate = period.StartDate.Date,
                        Room = room,
                        Status = "Draft",
                        CreatedAt = now,
                        LastUpdated = now
                    };

                    await _uow.Committees.AddAsync(committee);
                    await _uow.SaveChangesAsync();
                    await MarkCommitteeCodeReservationCommittedAsync(periodId, generatedCode, cancellationToken);

                    config.CouncilIds.Add(committee.CommitteeID);

                    var morning = chunk.Take(topicsPerSession).ToList();
                    var afternoon = chunk.Skip(topicsPerSession).Take(topicsPerSession).ToList();
                    var allCodes = chunk.Select(x => x.SupervisorLecturerCode).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);

                    var desiredCouncilTags = preferredTags.Count > 0
                        ? preferredTags.ToHashSet(StringComparer.OrdinalIgnoreCase)
                        : chunk.SelectMany(t => topicTags.TryGetValue(t.TopicCode, out var tags) ? tags.AsEnumerable() : Enumerable.Empty<string>()).ToHashSet(StringComparer.OrdinalIgnoreCase);

                    foreach (var tagCode in desiredCouncilTags)
                    {
                        var tagEntity = tagEntities.FirstOrDefault(t => string.Equals(t.TagCode, tagCode, StringComparison.OrdinalIgnoreCase));
                        if (tagEntity == null)
                        {
                            continue;
                        }

                        await _uow.CommitteeTags.AddAsync(new CommitteeTag
                        {
                            CommitteeID = committee.CommitteeID,
                            CommitteeCode = committee.CommitteeCode,
                            TagID = tagEntity.TagID,
                            TagCode = tagEntity.TagCode,
                            CreatedAt = now
                        });
                    }

                    var rankedLecturerCodes = _heuristicService
                        .RankLecturers(
                            lecturers
                                .Where(l => !allCodes.Contains(l.LecturerCode))
                                .Select(l => new LecturerHeuristicCandidate
                                {
                                    LecturerCode = l.LecturerCode,
                                    Tags = lecturerTagMap.TryGetValue(l.LecturerCode, out var tags)
                                        ? tags
                                        : new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                                    Workload = runtimeWorkloadMap.TryGetValue(l.LecturerCode, out var load) ? load : 0,
                                    BusySlots = busySlotMap.TryGetValue(l.LecturerCode, out var busySlots) ? busySlots : 0,
                                    ConsecutiveCommitteeAssignments = runtimeConsecutiveCommitteeMap.TryGetValue(l.LecturerCode, out var streak) ? streak : 0
                                })
                                .ToList(),
                            desiredCouncilTags,
                            request.Strategy.HeuristicWeights)
                        .Take(membersPerCouncil)
                        .Select(x => x.LecturerCode)
                        .ToList();

                    var availableLecturers = lecturers
                        .Where(x => rankedLecturerCodes.Contains(x.LecturerCode, StringComparer.OrdinalIgnoreCase))
                        .OrderBy(x => rankedLecturerCodes.FindIndex(code => string.Equals(code, x.LecturerCode, StringComparison.OrdinalIgnoreCase)))
                        .ToList();

                    var rolePlan = BuildRolePlan(membersPerCouncil);
                    var warning = string.Empty;

                    if (availableLecturers.Count < membersPerCouncil)
                    {
                        warning = "Không đủ giảng viên phù hợp theo ràng buộc GVHD/Tag.";
                    }

                    for (var m = 0; m < Math.Min(availableLecturers.Count, membersPerCouncil); m++)
                    {
                        var lecturer = availableLecturers[m];
                        await _uow.CommitteeMembers.AddAsync(new CommitteeMember
                        {
                            CommitteeID = committee.CommitteeID,
                            CommitteeCode = committee.CommitteeCode,
                            MemberLecturerProfileID = lecturer.LecturerProfileID,
                            MemberLecturerCode = lecturer.LecturerCode,
                            MemberUserCode = lecturer.UserCode,
                            MemberUserID = lecturer.UserID,
                            Role = rolePlan[m],
                            IsChair = rolePlan[m] == "CT",
                            CreatedAt = now,
                            LastUpdated = now
                        });

                        runtimeWorkloadMap[lecturer.LecturerCode] = (runtimeWorkloadMap.TryGetValue(lecturer.LecturerCode, out var currentLoad) ? currentLoad : 0) + 1;
                    }

                    var selectedLecturerSet = availableLecturers
                        .Select(x => x.LecturerCode)
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    foreach (var lecturer in lecturers)
                    {
                        if (selectedLecturerSet.Contains(lecturer.LecturerCode))
                        {
                            runtimeConsecutiveCommitteeMap[lecturer.LecturerCode] =
                                (runtimeConsecutiveCommitteeMap.TryGetValue(lecturer.LecturerCode, out var streak) ? streak : 0) + 1;
                            continue;
                        }

                        runtimeConsecutiveCommitteeMap[lecturer.LecturerCode] = 0;
                    }

                    if (availableLecturers.Count == membersPerCouncil)
                    {
                        committee.Status = "Ready";
                    }
                    else
                    {
                        committee.Status = "Warning";
                    }

                    var morningStart = ParseTime(config.MorningStart, new TimeSpan(7, 30, 0));
                    var afternoonStart = ParseTime(config.AfternoonStart, new TimeSpan(13, 30, 0));

                    for (var idx = 0; idx < morning.Count; idx++)
                    {
                        var t = morning[idx];
                        var start = morningStart.Add(TimeSpan.FromMinutes(idx * 60));
                        await CreateAssignmentAsync(committee, t, 1, start, now, cancellationToken);
                    }

                    for (var idx = 0; idx < afternoon.Count; idx++)
                    {
                        var t = afternoon[idx];
                        var start = afternoonStart.Add(TimeSpan.FromMinutes(idx * 60));
                        await CreateAssignmentAsync(committee, t, 2, start, now, cancellationToken);
                    }

                    councils.Add(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, warning, cancellationToken));
                    councilIndex++;
                }

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = now;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await AddAuditSnapshotAsync(
                    "GENERATE_COUNCILS",
                    "SUCCESS",
                    new { PeriodId = periodId, CouncilIds = beforeCouncilIds, CouncilCount = beforeCouncilIds.Count },
                    new { PeriodId = periodId, CouncilIds = config.CouncilIds, CouncilCount = councils.Count },
                    new { GeneratedCount = councils.Count, RequestTags = request.Tags },
                    actorUserId,
                    cancellationToken);
                await tx.CommitAsync(cancellationToken);
                await SendDefenseHubEventAsync("DefenseCouncilsGenerated", new { PeriodId = periodId, Count = councils.Count }, cancellationToken);

                return ApiResponse<List<CouncilDraftDto>>.SuccessResponse(councils);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<List<CouncilDraftDto>>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.2"), ex.Details);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<List<CouncilDraftDto>>(ex.Message, 500);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> CreateCouncilAsync(int periodId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (config.Finalized)
                {
                    throw new BusinessRuleException("Đợt bảo vệ đã finalize, không thể tạo mới hội đồng.");
                }

                if (!config.CouncilConfigConfirmed)
                {
                    throw new BusinessRuleException("Cần xác nhận cấu hình hội đồng (UC 2.1) trước khi tạo hội đồng.");
                }

                await ValidateCouncilPayloadAsync(config, request, cancellationToken);
                EnsureCouncilDateWithinPeriod(period, period.StartDate.Date);

                var now = DateTime.UtcNow;
                var uniqueCommitteeCode = await GenerateUniqueCommitteeCodeAsync(periodId, null, cancellationToken);
                var committee = new Committee
                {
                    CommitteeCode = uniqueCommitteeCode,
                    Name = "Manual Council",
                    DefenseDate = period.StartDate.Date,
                    Room = request.Room,
                    Status = "Draft",
                    CreatedAt = now,
                    LastUpdated = now
                };

                await _uow.Committees.AddAsync(committee);
                await _uow.SaveChangesAsync();
                await MarkCommitteeCodeReservationCommittedAsync(periodId, uniqueCommitteeCode, cancellationToken);

                await ApplyCouncilPayloadAsync(committee, request, now, cancellationToken);

                if (!config.CouncilIds.Contains(committee.CommitteeID))
                {
                    config.CouncilIds.Add(committee.CommitteeID);
                }

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = now;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "CREATE_COUNCIL",
                    "SUCCESS",
                    null,
                    new
                    {
                        committee.CommitteeID,
                        committee.CommitteeCode,
                        committee.Room,
                        committee.Status
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> UpdateCouncilAsync(int periodId, int councilId, CouncilUpsertDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.");
                }

                await ValidateCouncilPayloadAsync(config, request, cancellationToken);

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.");
                }

                EnsureCouncilDateWithinPeriod(period, committee.DefenseDate);

                if (string.IsNullOrWhiteSpace(request.ConcurrencyToken))
                {
                    throw new BusinessRuleException("Thiếu concurrencyToken khi cập nhật hội đồng.", "UC2.3.CONCURRENCY_TOKEN_REQUIRED");
                }

                var currentToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture);
                if (!string.Equals(currentToken, request.ConcurrencyToken.Trim(), StringComparison.Ordinal))
                {
                    throw new BusinessRuleException(
                        "Dữ liệu hội đồng đã bị thay đổi bởi người khác. Vui lòng tải lại trước khi lưu.",
                        "UC2.3.CONCURRENCY_CONFLICT",
                        new { currentToken, requestToken = request.ConcurrencyToken });
                }

                var now = DateTime.UtcNow;
                committee.Room = request.Room;
                committee.LastUpdated = now;
                committee.Status = "Draft";

                _uow.Committees.Update(committee);

                var existingAssignments = await _db.DefenseAssignments.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var existingMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var existingTags = await _db.CommitteeTags.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);

                _db.DefenseAssignments.RemoveRange(existingAssignments);
                _db.CommitteeMembers.RemoveRange(existingMembers);
                _db.CommitteeTags.RemoveRange(existingTags);

                await ApplyCouncilPayloadAsync(committee, request, now, cancellationToken);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "UPDATE_COUNCIL",
                    "SUCCESS",
                    null,
                    new
                    {
                        committee.CommitteeID,
                        committee.CommitteeCode,
                        committee.Room,
                        committee.Status,
                        committee.LastUpdated
                    },
                    new { PeriodId = periodId, CouncilId = councilId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> DeleteCouncilAsync(int periodId, int councilId, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.");
                }

                var assignments = await _db.DefenseAssignments.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var members = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var tags = await _db.CommitteeTags.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);

                _db.DefenseAssignments.RemoveRange(assignments);
                _db.CommitteeMembers.RemoveRange(members);
                _db.CommitteeTags.RemoveRange(tags);
                _db.Committees.Remove(committee);

                config.CouncilIds.Remove(councilId);
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "DELETE_COUNCIL",
                    "SUCCESS",
                    new
                    {
                        committee.CommitteeID,
                        committee.CommitteeCode,
                        committee.Room,
                        committee.Status
                    },
                    null,
                    new { PeriodId = periodId, CouncilId = councilId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<GenerateCouncilCodeResponseDto>> GenerateCouncilCodeAsync(int periodId, CancellationToken cancellationToken = default)
        {
            try
            {
                _ = await EnsurePeriodAsync(periodId, cancellationToken);
                var code = await GenerateUniqueCommitteeCodeAsync(periodId, null, cancellationToken);
                return ApiResponse<GenerateCouncilCodeResponseDto>.SuccessResponse(new GenerateCouncilCodeResponseDto
                {
                    CommitteeCode = code
                }, code: DefenseUcErrorCodes.AutoCode.Success);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<GenerateCouncilCodeResponseDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> CreateCouncilStep1Async(int periodId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (config.Finalized)
                {
                    throw new BusinessRuleException("Đợt bảo vệ đã finalize, không thể tạo hội đồng mới.", "UC2.3.FINALIZED");
                }

                if (string.IsNullOrWhiteSpace(request.Room))
                {
                    throw new BusinessRuleException("Room là bắt buộc.", "UC2.3.ROOM_REQUIRED");
                }

                EnsureCouncilDateWithinPeriod(period, request.DefenseDate);

                var now = DateTime.UtcNow;
                var uniqueCommitteeCode = await GenerateUniqueCommitteeCodeAsync(periodId, null, cancellationToken);
                var committee = new Committee
                {
                    CommitteeCode = uniqueCommitteeCode,
                    Name = string.IsNullOrWhiteSpace(request.Name) ? $"Hội đồng {uniqueCommitteeCode}" : request.Name.Trim(),
                    DefenseDate = request.DefenseDate.Date,
                    Room = request.Room.Trim(),
                    Status = "Draft",
                    CreatedAt = now,
                    LastUpdated = now
                };

                await _uow.Committees.AddAsync(committee);
                await _uow.SaveChangesAsync();
                await MarkCommitteeCodeReservationCommittedAsync(periodId, uniqueCommitteeCode, cancellationToken);

                await SaveCouncilTagsAsync(committee, request.CouncilTags, now, cancellationToken);

                if (!config.CouncilIds.Contains(committee.CommitteeID))
                {
                    config.CouncilIds.Add(committee.CommitteeID);
                }

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = now;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "CREATE_COUNCIL_STEP1",
                    "SUCCESS",
                    null,
                    new
                    {
                        committee.CommitteeID,
                        committee.CommitteeCode,
                        committee.Name,
                        committee.DefenseDate,
                        committee.Room,
                        committee.Status
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.STEP1"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> UpdateCouncilStep1Async(int periodId, int councilId, CouncilWorkflowStep1Dto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                if (string.IsNullOrWhiteSpace(request.ConcurrencyToken))
                {
                    throw new BusinessRuleException("Thiếu concurrencyToken khi cập nhật hội đồng.", "UC2.3.CONCURRENCY_TOKEN_REQUIRED");
                }

                var currentToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture);
                if (!string.Equals(currentToken, request.ConcurrencyToken.Trim(), StringComparison.Ordinal))
                {
                    throw new BusinessRuleException("Dữ liệu hội đồng đã thay đổi. Vui lòng tải lại trước khi lưu.", "UC2.3.CONCURRENCY_CONFLICT", new { currentToken, requestToken = request.ConcurrencyToken });
                }

                if (string.IsNullOrWhiteSpace(request.Room))
                {
                    throw new BusinessRuleException("Room là bắt buộc.", "UC2.3.ROOM_REQUIRED");
                }

                EnsureCouncilDateWithinPeriod(period, request.DefenseDate);

                var now = DateTime.UtcNow;
                committee.Name = string.IsNullOrWhiteSpace(request.Name) ? committee.Name : request.Name.Trim();
                committee.Room = request.Room.Trim();
                committee.DefenseDate = request.DefenseDate.Date;
                committee.Status = "Draft";
                committee.LastUpdated = now;
                _uow.Committees.Update(committee);

                await SaveCouncilTagsAsync(committee, request.CouncilTags, now, cancellationToken);
                await _uow.SaveChangesAsync();

                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "UPDATE_COUNCIL_STEP1",
                    "SUCCESS",
                    null,
                    new
                    {
                        committee.CommitteeID,
                        committee.CommitteeCode,
                        committee.Name,
                        committee.DefenseDate,
                        committee.Room,
                        committee.Status,
                        committee.LastUpdated
                    },
                    new { PeriodId = periodId, CouncilId = councilId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.STEP1"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> SaveCouncilMembersStepAsync(int periodId, int councilId, CouncilWorkflowStep2Dto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                if (string.IsNullOrWhiteSpace(request.ConcurrencyToken))
                {
                    throw new BusinessRuleException("Thiếu concurrencyToken khi cập nhật thành viên.", "UC2.3.CONCURRENCY_TOKEN_REQUIRED");
                }

                var currentToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture);
                if (!string.Equals(currentToken, request.ConcurrencyToken.Trim(), StringComparison.Ordinal))
                {
                    throw new BusinessRuleException("Dữ liệu hội đồng đã thay đổi. Vui lòng tải lại trước khi lưu.", "UC2.3.CONCURRENCY_CONFLICT", new { currentToken, requestToken = request.ConcurrencyToken });
                }

                var now = DateTime.UtcNow;
                var existingMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var beforeMembers = existingMembers
                    .Select(x => new
                    {
                        x.MemberLecturerCode,
                        x.Role,
                        x.IsChair,
                        x.MemberUserCode
                    })
                    .OrderBy(x => x.MemberLecturerCode)
                    .ToList();
                if (existingMembers.Count > 0)
                {
                    _db.CommitteeMembers.RemoveRange(existingMembers);
                }

                await SaveCouncilMembersAsync(committee, request.Members, now, cancellationToken);
                committee.LastUpdated = now;
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();

                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "SAVE_COUNCIL_STEP2_MEMBERS",
                    "SUCCESS",
                    new { CouncilId = councilId, Members = beforeMembers },
                    new
                    {
                        CouncilId = councilId,
                        MemberCount = request.Members.Count,
                        Members = request.Members
                            .Select(x => new { x.LecturerCode, x.Role })
                            .OrderBy(x => x.LecturerCode)
                            .ToList()
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.STEP2"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> SaveCouncilTopicsStepAsync(int periodId, int councilId, CouncilWorkflowStep3Dto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                if (string.IsNullOrWhiteSpace(request.ConcurrencyToken))
                {
                    throw new BusinessRuleException("Thiếu concurrencyToken khi cập nhật đề tài.", "UC2.3.CONCURRENCY_TOKEN_REQUIRED");
                }

                var currentToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture);
                if (!string.Equals(currentToken, request.ConcurrencyToken.Trim(), StringComparison.Ordinal))
                {
                    throw new BusinessRuleException("Dữ liệu hội đồng đã thay đổi. Vui lòng tải lại trước khi lưu.", "UC2.3.CONCURRENCY_CONFLICT", new { currentToken, requestToken = request.ConcurrencyToken });
                }

                var now = DateTime.UtcNow;
                var existingAssignments = await _db.DefenseAssignments.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var beforeAssignments = existingAssignments
                    .Select(x => new
                    {
                        x.TopicCode,
                        x.Session,
                        x.ScheduledAt,
                        x.StartTime,
                        x.EndTime,
                        x.OrderIndex,
                        x.Status
                    })
                    .OrderBy(x => x.Session)
                    .ThenBy(x => x.OrderIndex)
                    .ToList();
                if (existingAssignments.Count > 0)
                {
                    _db.DefenseAssignments.RemoveRange(existingAssignments);
                }

                await SaveCouncilAssignmentsAsync(committee, request.Assignments, now, cancellationToken);
                committee.LastUpdated = now;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();

                await tx.CommitAsync(cancellationToken);
                await AddAuditSnapshotAsync(
                    "SAVE_COUNCIL_STEP3_TOPICS",
                    "SUCCESS",
                    new { CouncilId = councilId, Assignments = beforeAssignments },
                    new
                    {
                        CouncilId = councilId,
                        TopicCount = request.Assignments.Count,
                        Assignments = request.Assignments
                            .Select(x => new
                            {
                                x.TopicCode,
                                x.SessionCode,
                                x.ScheduledAt,
                                x.StartTime,
                                x.EndTime,
                                x.OrderIndex
                            })
                            .OrderBy(x => x.SessionCode)
                            .ThenBy(x => x.OrderIndex)
                            .ToList()
                    },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, committee.CommitteeID, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.STEP3"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> AddCouncilMemberItemAsync(int periodId, int councilId, AddCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var normalizedLecturerCode = request.LecturerCode.Trim();
                var normalizedRole = NormalizeRole(request.Role);
                var membersPerCouncil = NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig);

                var existingMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                if (existingMembers.Any(x => string.Equals(x.MemberLecturerCode, normalizedLecturerCode, StringComparison.OrdinalIgnoreCase)))
                {
                    throw new BusinessRuleException("Không được trùng giảng viên trong cùng hội đồng.", "UC2.3.DUPLICATE_MEMBER", new { LecturerCode = normalizedLecturerCode });
                }

                if (existingMembers.Count >= membersPerCouncil)
                {
                    throw new BusinessRuleException($"Hội đồng chỉ cho phép tối đa {membersPerCouncil} thành viên.", "UC2.3.INVALID_MEMBER_COUNT");
                }

                var roles = existingMembers.Select(x => NormalizeRole(x.Role)).Append(normalizedRole).ToList();
                ValidateRolePlanPartial(roles, membersPerCouncil, "UC2.3.INVALID_ROLE_PLAN");

                await SaveCouncilMembersAsync(committee, existingMembers
                    .Select(x => new CouncilMemberInputDto
                    {
                        LecturerCode = x.MemberLecturerCode ?? string.Empty,
                        Role = x.Role ?? string.Empty
                    })
                    .Append(new CouncilMemberInputDto
                    {
                        LecturerCode = normalizedLecturerCode,
                        Role = normalizedRole
                    })
                    .ToList(), DateTime.UtcNow, cancellationToken);

                _db.CommitteeMembers.RemoveRange(existingMembers);
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "ADD_COUNCIL_MEMBER_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, MemberCount = existingMembers.Count },
                    new { CouncilId = councilId, MemberCount = existingMembers.Count + 1, LecturerCode = normalizedLecturerCode, Role = normalizedRole },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.MEMBER_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> UpdateCouncilMemberItemAsync(int periodId, int councilId, string lecturerCode, UpdateCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var normalizedSourceCode = lecturerCode.Trim();
                var existingMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var targetMember = existingMembers.FirstOrDefault(x => string.Equals(x.MemberLecturerCode, normalizedSourceCode, StringComparison.OrdinalIgnoreCase));
                if (targetMember == null)
                {
                    throw new BusinessRuleException("Không tìm thấy thành viên cần sửa.", "UC2.3.MEMBER_NOT_FOUND");
                }

                var nextLecturerCode = string.IsNullOrWhiteSpace(request.LecturerCode)
                    ? (targetMember.MemberLecturerCode ?? string.Empty)
                    : request.LecturerCode.Trim();
                var nextRole = string.IsNullOrWhiteSpace(request.Role)
                    ? NormalizeRole(targetMember.Role)
                    : NormalizeRole(request.Role);

                if (existingMembers.Any(x =>
                    !string.Equals(x.MemberLecturerCode, normalizedSourceCode, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(x.MemberLecturerCode, nextLecturerCode, StringComparison.OrdinalIgnoreCase)))
                {
                    throw new BusinessRuleException("Không được trùng giảng viên trong cùng hội đồng.", "UC2.3.DUPLICATE_MEMBER", new { LecturerCode = nextLecturerCode });
                }

                var membersPerCouncil = NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig);
                var updatedMembers = existingMembers
                    .Select(x => new CouncilMemberInputDto
                    {
                        LecturerCode = string.Equals(x.MemberLecturerCode, normalizedSourceCode, StringComparison.OrdinalIgnoreCase)
                            ? nextLecturerCode
                            : (x.MemberLecturerCode ?? string.Empty),
                        Role = string.Equals(x.MemberLecturerCode, normalizedSourceCode, StringComparison.OrdinalIgnoreCase)
                            ? nextRole
                            : (x.Role ?? string.Empty)
                    })
                    .ToList();

                ValidateRolePlanPartial(updatedMembers.Select(x => NormalizeRole(x.Role)).ToList(), membersPerCouncil, "UC2.3.INVALID_ROLE_PLAN");

                _db.CommitteeMembers.RemoveRange(existingMembers);
                await SaveCouncilMembersAsync(committee, updatedMembers, DateTime.UtcNow, cancellationToken);

                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "UPDATE_COUNCIL_MEMBER_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, SourceLecturerCode = normalizedSourceCode },
                    new { CouncilId = councilId, LecturerCode = nextLecturerCode, Role = nextRole },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.MEMBER_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> RemoveCouncilMemberItemAsync(int periodId, int councilId, string lecturerCode, RemoveCouncilMemberItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var normalizedLecturerCode = lecturerCode.Trim();
                var existingMembers = await _db.CommitteeMembers.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                var targetMember = existingMembers.FirstOrDefault(x => string.Equals(x.MemberLecturerCode, normalizedLecturerCode, StringComparison.OrdinalIgnoreCase));
                if (targetMember == null)
                {
                    throw new BusinessRuleException("Không tìm thấy thành viên cần xóa.", "UC2.3.MEMBER_NOT_FOUND");
                }

                _db.CommitteeMembers.Remove(targetMember);
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "REMOVE_COUNCIL_MEMBER_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, LecturerCode = normalizedLecturerCode },
                    new { CouncilId = councilId, MemberCount = Math.Max(0, existingMembers.Count - 1) },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.MEMBER_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> AddCouncilTopicItemAsync(int periodId, int councilId, AddCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var normalizedTopicCode = request.TopicCode.Trim();
                var session = ToSessionNumber(request.SessionCode);
                var scheduledAt = (request.ScheduledAt ?? committee.DefenseDate ?? DateTime.UtcNow.Date).Date;
                var start = ParseRequiredTime(request.StartTime, "UC2.3.INVALID_START_TIME");
                var end = ParseRequiredTime(request.EndTime, "UC2.3.INVALID_END_TIME");
                if (end <= start)
                {
                    throw new BusinessRuleException("endTime phải lớn hơn startTime.", "UC2.3.INVALID_TIME_RANGE");
                }

                var assignments = await _db.DefenseAssignments.Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
                if (assignments.Any(x => string.Equals(x.TopicCode, normalizedTopicCode, StringComparison.OrdinalIgnoreCase)))
                {
                    throw new BusinessRuleException("Không được gán trùng đề tài trong cùng hội đồng.", "UC2.3.DUPLICATE_TOPIC", new { TopicCode = normalizedTopicCode });
                }

                var topicsPerSession = NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig);
                if (assignments.Count(x => x.Session == session) >= topicsPerSession)
                {
                    throw new BusinessRuleException($"Mỗi buổi chỉ cho phép tối đa {topicsPerSession} đề tài.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
                }

                var topic = await _db.Topics.FirstOrDefaultAsync(x => x.TopicCode == normalizedTopicCode, cancellationToken);
                if (topic == null)
                {
                    throw new BusinessRuleException("Đề tài không tồn tại.", "UC2.3.TOPIC_NOT_FOUND");
                }

                var eligible = await LoadEligibleTopicCodesFromMilestonesAsync(new[] { topic }, cancellationToken);
                if (!eligible.Contains(topic.TopicCode))
                {
                    throw new BusinessRuleException("Đề tài chưa đạt điều kiện bảo vệ theo ProgressMilestones.", "UC2.3.TOPIC_NOT_ELIGIBLE");
                }

                await _constraintService.EnsureUniqueStudentAssignmentAsync(councilId, new[] { normalizedTopicCode }, cancellationToken);
                await _constraintService.EnsureNoLecturerOverlapAsync(councilId, new List<(DateTime Date, int Session)> { (scheduledAt, session) }, cancellationToken);

                var memberCodes = await _db.CommitteeMembers.AsNoTracking()
                    .Where(x => x.CommitteeID == councilId && x.MemberLecturerCode != null)
                    .Select(x => x.MemberLecturerCode!)
                    .ToListAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode)
                    && memberCodes.Contains(topic.SupervisorLecturerCode, StringComparer.OrdinalIgnoreCase))
                {
                    throw new BusinessRuleException("Vi phạm ràng buộc GVHD không được nằm trong hội đồng của SV mình hướng dẫn.", "UC2.3.SUPERVISOR_CONFLICT");
                }

                var orderIndex = request.OrderIndex ?? (assignments.Where(x => x.Session == session).Select(x => x.OrderIndex ?? 0).DefaultIfEmpty(0).Max() + 1);
                await _uow.DefenseAssignments.AddAsync(new DefenseAssignment
                {
                    AssignmentCode = $"AS{committee.CommitteeCode}_{normalizedTopicCode}_{session}_{orderIndex:D2}",
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    TopicID = topic.TopicID,
                    TopicCode = normalizedTopicCode,
                    ScheduledAt = scheduledAt,
                    Session = session,
                    Shift = session == 1 ? DefenseSessionCodes.Morning : DefenseSessionCodes.Afternoon,
                    OrderIndex = orderIndex,
                    StartTime = start,
                    EndTime = end,
                    AssignedBy = "admin",
                    AssignedAt = DateTime.UtcNow,
                    Status = DefenseWorkflowStateMachine.ToValue(AssignmentStatus.Pending),
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                });

                MarkTopicAssigned(topic, DateTime.UtcNow);
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "ADD_COUNCIL_TOPIC_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, TopicCount = assignments.Count },
                    new { CouncilId = councilId, TopicCode = normalizedTopicCode, Session = session, OrderIndex = orderIndex },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.TOPIC_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> UpdateCouncilTopicItemAsync(int periodId, int councilId, int assignmentId, UpdateCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var assignment = await _db.DefenseAssignments.FirstOrDefaultAsync(x => x.AssignmentID == assignmentId && x.CommitteeID == councilId, cancellationToken);
                if (assignment == null)
                {
                    throw new BusinessRuleException("Không tìm thấy đề tài cần sửa trong hội đồng.", "UC2.3.ASSIGNMENT_NOT_FOUND");
                }

                var session = string.IsNullOrWhiteSpace(request.SessionCode) ? (assignment.Session ?? 1) : ToSessionNumber(request.SessionCode);
                var scheduledAt = (request.ScheduledAt ?? assignment.ScheduledAt ?? committee.DefenseDate ?? DateTime.UtcNow.Date).Date;
                var start = string.IsNullOrWhiteSpace(request.StartTime) ? (assignment.StartTime ?? TimeSpan.FromHours(7.5)) : ParseRequiredTime(request.StartTime, "UC2.3.INVALID_START_TIME");
                var end = string.IsNullOrWhiteSpace(request.EndTime) ? (assignment.EndTime ?? start.Add(TimeSpan.FromMinutes(60))) : ParseRequiredTime(request.EndTime, "UC2.3.INVALID_END_TIME");
                if (end <= start)
                {
                    throw new BusinessRuleException("endTime phải lớn hơn startTime.", "UC2.3.INVALID_TIME_RANGE");
                }

                var topicsPerSession = NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig);
                var sessionCount = await _db.DefenseAssignments.AsNoTracking()
                    .Where(x => x.CommitteeID == councilId && x.AssignmentID != assignmentId && x.Session == session)
                    .CountAsync(cancellationToken);
                if (sessionCount >= topicsPerSession)
                {
                    throw new BusinessRuleException($"Mỗi buổi chỉ cho phép tối đa {topicsPerSession} đề tài.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
                }

                assignment.Session = session;
                assignment.Shift = session == 1 ? DefenseSessionCodes.Morning : DefenseSessionCodes.Afternoon;
                assignment.ScheduledAt = scheduledAt;
                assignment.StartTime = start;
                assignment.EndTime = end;
                assignment.OrderIndex = request.OrderIndex ?? assignment.OrderIndex;
                assignment.LastUpdated = DateTime.UtcNow;
                assignment.AssignmentCode = $"AS{committee.CommitteeCode}_{assignment.TopicCode}_{session}_{(assignment.OrderIndex ?? 1):D2}";

                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "UPDATE_COUNCIL_TOPIC_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, AssignmentId = assignmentId },
                    new { CouncilId = councilId, AssignmentId = assignmentId, Session = session, assignment.OrderIndex },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.TOPIC_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<CouncilDraftDto>> RemoveCouncilTopicItemAsync(int periodId, int councilId, int assignmentId, RemoveCouncilTopicItemDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                if (!config.CouncilIds.Contains(councilId))
                {
                    throw new BusinessRuleException("Hội đồng không thuộc đợt bảo vệ này.", "UC2.3.COUNCIL_NOT_IN_PERIOD");
                }

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.", "UC2.3.COUNCIL_NOT_FOUND");
                }

                EnsureConcurrencyToken(committee, request.ConcurrencyToken);

                var assignment = await _db.DefenseAssignments.FirstOrDefaultAsync(x => x.AssignmentID == assignmentId && x.CommitteeID == councilId, cancellationToken);
                if (assignment == null)
                {
                    throw new BusinessRuleException("Không tìm thấy đề tài cần xóa trong hội đồng.", "UC2.3.ASSIGNMENT_NOT_FOUND");
                }

                _db.DefenseAssignments.Remove(assignment);
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Draft);
                committee.LastUpdated = DateTime.UtcNow;
                _uow.Committees.Update(committee);
                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "REMOVE_COUNCIL_TOPIC_ITEM",
                    "SUCCESS",
                    new { CouncilId = councilId, AssignmentId = assignmentId, assignment.TopicCode },
                    new { CouncilId = councilId },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);

                return ApiResponse<CouncilDraftDto>.SuccessResponse(await BuildCouncilDtoAsync(periodId, councilId, null, cancellationToken));
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<CouncilDraftDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3.TOPIC_ITEM"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> FinalizeAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (await IsIdempotentReplayAsync("FINALIZE", periodId, request.IdempotencyKey, cancellationToken))
            {
                return ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Council.FinalizeReplay, idempotencyReplay: true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeState = new { period.Status, config.Finalized };

                var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                var warnings = new List<string>();
                foreach (var committee in councils)
                {
                    var validation = await ValidateCouncilHardRulesAsync(
                        committee.CommitteeID,
                        NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig),
                        NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig),
                        cancellationToken);
                    if (!string.IsNullOrWhiteSpace(validation))
                    {
                        warnings.Add($"{committee.CommitteeCode}: {validation}");
                        committee.Status = "Warning";
                    }
                    else if (string.Equals(committee.Status, "Draft", StringComparison.OrdinalIgnoreCase))
                    {
                        DefenseWorkflowStateMachine.EnsureCommitteeTransition(CommitteeStatus.Draft, CommitteeStatus.Ready, "UC2.4.INVALID_COMMITTEE_STATE");
                        committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Ready);
                    }

                    var normalizedStatus = DefenseWorkflowStateMachine.ParseCommitteeStatus(committee.Status);
                    if (normalizedStatus == CommitteeStatus.Completed)
                    {
                        DefenseWorkflowStateMachine.EnsureCommitteeTransition(CommitteeStatus.Completed, CommitteeStatus.Finalized, "UC2.4.INVALID_COMMITTEE_STATE");
                        committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Finalized);
                    }
                }

                if (warnings.Count > 0 && !request.AllowFinalizeAfterWarning)
                {
                    throw new BusinessRuleException("Vẫn còn warning, bật allowFinalizeAfterWarning để chốt.", "UC2.4.FINALIZE_BLOCKED_BY_WARNING", warnings);
                }

                config.Finalized = true;
                period.Status = "Finalized";
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "FINALIZE",
                    "SUCCESS",
                    beforeState,
                    new { period.Status, config.Finalized },
                    new { PeriodId = periodId, WarningCount = warnings.Count, Warnings = warnings },
                    actorUserId,
                    cancellationToken);
                await SendDefenseHubEventAsync("DefensePeriodFinalized", new { PeriodId = periodId, WarningCount = warnings.Count }, cancellationToken);

                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.4"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> PublishScoresAsync(int periodId, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            if (await IsIdempotentReplayAsync("PUBLISH_SCORES", periodId, idempotencyKey, cancellationToken))
            {
                return ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Publish.Replay, idempotencyReplay: true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var beforeState = new { period.Status, config.ScoresPublished };
                if (!config.Finalized)
                {
                    throw new BusinessRuleException("Chỉ được công bố điểm sau khi finalize.", "UC4.3.PUBLISH_BEFORE_FINALIZE");
                }

                var assignments = await GetPeriodAssignmentsAsync(config, cancellationToken);
                var now = DateTime.UtcNow;
                foreach (var assignment in assignments)
                {
                    var topic = await _db.Topics.AsNoTracking().FirstOrDefaultAsync(x => x.TopicCode == assignment.TopicCode, cancellationToken);
                    if (topic == null)
                    {
                        throw new BusinessRuleException($"Không tìm thấy đề tài cho assignment {assignment.AssignmentID}.");
                    }

                    var result = await _db.DefenseResults.FirstOrDefaultAsync(x => x.AssignmentId == assignment.AssignmentID, cancellationToken);
                    if (result == null)
                    {
                        result = new DefenseResult
                        {
                            AssignmentId = assignment.AssignmentID,
                            CreatedAt = now,
                            LastUpdated = now,
                            IsLocked = true
                        };
                        await _uow.DefenseResults.AddAsync(result);
                    }

                    var scores = await _db.DefenseScores.Where(x => x.AssignmentID == assignment.AssignmentID && x.IsSubmitted).ToListAsync(cancellationToken);
                    if (scores.Count == 0)
                    {
                        throw new BusinessRuleException($"Assignment {assignment.AssignmentCode} chưa có dữ liệu điểm để công bố.");
                    }

                    decimal? scoreCt = scores.Where(x => NormalizeRole(x.Role) == "CT").Select(x => (decimal?)x.Score).FirstOrDefault();
                    decimal? scoreTk = scores.Where(x => NormalizeRole(x.Role) == "TK").Select(x => (decimal?)x.Score).FirstOrDefault();
                    decimal? scorePb = scores.Where(x => NormalizeRole(x.Role) == "PB").Select(x => (decimal?)x.Score).FirstOrDefault();
                    decimal? scoreGvhd = result.ScoreGvhd;

                    if (!scoreGvhd.HasValue && !string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode))
                    {
                        scoreGvhd = scores
                            .Where(x => string.Equals(x.MemberLecturerCode, topic.SupervisorLecturerCode, StringComparison.OrdinalIgnoreCase))
                            .Select(x => (decimal?)x.Score)
                            .FirstOrDefault();
                    }

                    if (!scoreGvhd.HasValue || !scoreCt.HasValue || !scoreTk.HasValue || !scorePb.HasValue)
                    {
                        throw new BusinessRuleException(
                            $"Thiếu điểm thành phần bắt buộc (GVHD/CT/TK/PB) cho assignment {assignment.AssignmentCode}.",
                            details: new
                            {
                                assignment.AssignmentCode,
                                Missing = new
                                {
                                    GVHD = !scoreGvhd.HasValue,
                                    CT = !scoreCt.HasValue,
                                    TK = !scoreTk.HasValue,
                                    PB = !scorePb.HasValue
                                }
                            });
                    }

                    result.ScoreGvhd = scoreGvhd;
                    result.ScoreCt = scoreCt;
                    result.ScoreUvtk = scoreTk;
                    result.ScoreUvpb = scorePb;
                    result.FinalScoreNumeric = Math.Round((scoreGvhd.Value + scoreCt.Value + scoreTk.Value + scorePb.Value) / 4m, 1);
                    result.FinalScoreText = ToGrade(result.FinalScoreNumeric);
                    result.LastUpdated = now;
                    result.IsLocked = true;
                    _uow.DefenseResults.Update(result);
                }

                config.ScoresPublished = true;
                period.Status = "Published";
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = now;
                _uow.DefenseTerms.Update(period);

                var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                foreach (var council in councils)
                {
                    var status = DefenseWorkflowStateMachine.ParseCommitteeStatus(council.Status);
                    if (status == CommitteeStatus.Finalized)
                    {
                        DefenseWorkflowStateMachine.EnsureCommitteeTransition(CommitteeStatus.Finalized, CommitteeStatus.Published, "UC4.3.INVALID_COMMITTEE_STATE");
                        council.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Published);
                        council.LastUpdated = now;
                        _uow.Committees.Update(council);
                    }
                }

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    "PUBLISH_SCORES",
                    "SUCCESS",
                    beforeState,
                    new { period.Status, config.ScoresPublished },
                    new { PeriodId = periodId },
                    actorUserId,
                    cancellationToken);
                await SendDefenseHubEventAsync("DefenseScoresPublished", new { PeriodId = periodId }, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<RollbackDefensePeriodResponseDto>> RollbackAsync(int periodId, RollbackDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (await IsIdempotentReplayAsync("ROLLBACK", periodId, request.IdempotencyKey, cancellationToken))
            {
                return ApiResponse<RollbackDefensePeriodResponseDto>.SuccessResponse(new RollbackDefensePeriodResponseDto
                {
                    Target = request.Target,
                    RolledBackAt = DateTime.UtcNow
                }, code: DefenseUcErrorCodes.Publish.RollbackReplay, idempotencyReplay: true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                var target = (request.Target ?? string.Empty).Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    throw new BusinessRuleException("Lý do rollback là bắt buộc.", "UC4.4.ROLLBACK_REASON_REQUIRED");
                }

                if (target != "PUBLISH" && target != "FINALIZE" && target != "ALL")
                {
                    throw new BusinessRuleException("Target rollback không hợp lệ. Chỉ hỗ trợ PUBLISH, FINALIZE hoặc ALL.", "UC4.4.ROLLBACK_TARGET_INVALID");
                }

                var now = DateTime.UtcNow;
                var beforePeriodStatus = period.Status ?? string.Empty;
                var beforeFinalized = config.Finalized;
                var beforeScoresPublished = config.ScoresPublished;
                var updatedCommitteeCount = 0;
                var updatedResultCount = 0;

                async Task<(int CommitteeCount, int ResultCount)> RollbackPublishAsync()
                {
                    if (!config.ScoresPublished)
                    {
                        throw new BusinessRuleException("Đợt bảo vệ chưa publish điểm để rollback.", "UC4.4.ROLLBACK_PUBLISH_INVALID_STATE");
                    }

                    var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                    var localCommitteeCount = 0;
                    foreach (var council in councils)
                    {
                        var status = DefenseWorkflowStateMachine.ParseCommitteeStatus(council.Status);
                        if (status == CommitteeStatus.Published)
                        {
                            council.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Finalized);
                            council.LastUpdated = now;
                            _uow.Committees.Update(council);
                            localCommitteeCount++;
                        }
                    }

                    var localResultCount = 0;
                    if (request.ForceUnlockScores)
                    {
                        var assignments = await GetPeriodAssignmentsAsync(config, cancellationToken);
                        var assignmentIds = assignments.Select(x => x.AssignmentID).ToList();
                        if (assignmentIds.Count > 0)
                        {
                            var results = await _db.DefenseResults.Where(x => assignmentIds.Contains(x.AssignmentId)).ToListAsync(cancellationToken);
                            foreach (var result in results)
                            {
                                if (!result.IsLocked)
                                {
                                    continue;
                                }

                                result.IsLocked = false;
                                result.LastUpdated = now;
                                _uow.DefenseResults.Update(result);
                                localResultCount++;
                            }
                        }
                    }

                    config.ScoresPublished = false;
                    period.Status = config.Finalized ? "Finalized" : "Preparing";
                    return (localCommitteeCount, localResultCount);
                }

                async Task<int> RollbackFinalizeAsync()
                {
                    if (config.ScoresPublished)
                    {
                        throw new BusinessRuleException("Đợt bảo vệ đã publish điểm. Cần rollback publish trước khi rollback finalize.", "UC4.4.ROLLBACK_FINALIZE_BLOCKED_BY_PUBLISH");
                    }

                    if (!config.Finalized)
                    {
                        throw new BusinessRuleException("Đợt bảo vệ chưa finalize để rollback.", "UC2.5.ROLLBACK_FINALIZE_INVALID_STATE");
                    }

                    var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                    var localCommitteeCount = 0;
                    foreach (var council in councils)
                    {
                        var status = DefenseWorkflowStateMachine.ParseCommitteeStatus(council.Status);
                        if (status == CommitteeStatus.Finalized)
                        {
                            council.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Completed);
                            council.LastUpdated = now;
                            _uow.Committees.Update(council);
                            localCommitteeCount++;
                        }
                    }

                    config.Finalized = false;
                    period.Status = "Preparing";
                    return localCommitteeCount;
                }

                if (target == "PUBLISH")
                {
                    var rollbackPublish = await RollbackPublishAsync();
                    updatedCommitteeCount += rollbackPublish.CommitteeCount;
                    updatedResultCount += rollbackPublish.ResultCount;
                }

                if (target == "FINALIZE")
                {
                    updatedCommitteeCount += await RollbackFinalizeAsync();
                }

                if (target == "ALL")
                {
                    if (config.ScoresPublished)
                    {
                        var assignments = await GetPeriodAssignmentsAsync(config, cancellationToken);
                        var assignmentIds = assignments.Select(x => x.AssignmentID).ToList();
                        if (request.ForceUnlockScores && assignmentIds.Count > 0)
                        {
                            var results = await _db.DefenseResults.Where(x => assignmentIds.Contains(x.AssignmentId) && x.IsLocked).ToListAsync(cancellationToken);
                            foreach (var result in results)
                            {
                                result.IsLocked = false;
                                result.LastUpdated = now;
                                _uow.DefenseResults.Update(result);
                            }

                            updatedResultCount += results.Count;
                        }

                        var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                        foreach (var council in councils)
                        {
                            var status = DefenseWorkflowStateMachine.ParseCommitteeStatus(council.Status);
                            if (status == CommitteeStatus.Published)
                            {
                                council.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Finalized);
                                council.LastUpdated = now;
                                _uow.Committees.Update(council);
                                updatedCommitteeCount++;
                            }
                        }

                        config.ScoresPublished = false;
                        period.Status = config.Finalized ? "Finalized" : "Preparing";
                    }

                    if (config.Finalized)
                    {
                        var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                        foreach (var council in councils)
                        {
                            var status = DefenseWorkflowStateMachine.ParseCommitteeStatus(council.Status);
                            if (status == CommitteeStatus.Finalized)
                            {
                                council.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Completed);
                                council.LastUpdated = now;
                                _uow.Committees.Update(council);
                                updatedCommitteeCount++;
                            }
                        }

                        config.Finalized = false;
                        period.Status = "Preparing";
                    }
                }

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = now;
                _uow.DefenseTerms.Update(period);

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditSnapshotAsync(
                    $"ROLLBACK_{target}",
                    "SUCCESS",
                    new
                    {
                        PeriodStatus = beforePeriodStatus,
                        Finalized = beforeFinalized,
                        ScoresPublished = beforeScoresPublished
                    },
                    new
                    {
                        PeriodStatus = period.Status,
                        Finalized = config.Finalized,
                        ScoresPublished = config.ScoresPublished
                    },
                    new
                    {
                        PeriodId = periodId,
                        Target = target,
                        request.Reason,
                        UpdatedCommittees = updatedCommitteeCount,
                        UpdatedResults = updatedResultCount
                    },
                    actorUserId,
                    cancellationToken);

                await SendDefenseHubEventAsync("DefensePeriodRollback", new { PeriodId = periodId, Target = target, Reason = request.Reason }, cancellationToken);

                return ApiResponse<RollbackDefensePeriodResponseDto>.SuccessResponse(new RollbackDefensePeriodResponseDto
                {
                    Target = target,
                    PeriodStatusBefore = beforePeriodStatus,
                    PeriodStatusAfter = period.Status ?? string.Empty,
                    FinalizedBefore = beforeFinalized,
                    FinalizedAfter = config.Finalized,
                    ScoresPublishedBefore = beforeScoresPublished,
                    ScoresPublishedAfter = config.ScoresPublished,
                    UpdatedCommitteeCount = updatedCommitteeCount,
                    UpdatedResultCount = updatedResultCount,
                    RolledBackAt = now
                });
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<RollbackDefensePeriodResponseDto>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.4"), ex.Details);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<RollbackDefensePeriodResponseDto>(ex.Message, 500, DefenseUcErrorCodes.Publish.RollbackFailed);
            }
        }

        public async Task<ApiResponse<bool>> SaveLecturerMinuteAsync(int committeeId, UpdateLecturerMinutesDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                var assignment = await _db.DefenseAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.AssignmentID == request.AssignmentId && x.CommitteeID == committeeId, cancellationToken);
                if (assignment == null)
                {
                    throw new BusinessRuleException("Assignment không thuộc hội đồng.");
                }

                var minute = await _db.DefenseMinutes.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                var beforeSnapshot = minute == null
                    ? null
                    : new
                    {
                        minute.SummaryContent,
                        minute.ReviewerComments,
                        minute.QnaDetails,
                        minute.Strengths,
                        minute.Weaknesses,
                        minute.Recommendations,
                        minute.LastUpdated
                    };
                if (minute == null)
                {
                    minute = new DefenseMinute
                    {
                        AssignmentId = request.AssignmentId,
                        SecretaryId = actorUserId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.DefenseMinutes.AddAsync(minute);
                }

                minute.SummaryContent = request.SummaryContent;
                minute.ReviewerComments = request.ReviewerComments;
                minute.QnaDetails = request.QnaDetails;
                minute.Strengths = request.Strengths;
                minute.Weaknesses = request.Weaknesses;
                minute.Recommendations = request.Recommendations;
                minute.LastUpdated = DateTime.UtcNow;

                if (minute.Id > 0)
                {
                    _uow.DefenseMinutes.Update(minute);
                }

                await _uow.SaveChangesAsync();
                await AddAuditSnapshotAsync(
                    "SAVE_LECTURER_MINUTE",
                    "SUCCESS",
                    beforeSnapshot,
                    new
                    {
                        minute.SummaryContent,
                        minute.ReviewerComments,
                        minute.QnaDetails,
                        minute.Strengths,
                        minute.Weaknesses,
                        minute.Recommendations,
                        minute.LastUpdated
                    },
                    new
                    {
                        CommitteeId = committeeId,
                        request.AssignmentId
                    },
                    actorUserId,
                    cancellationToken);
                await SendDefenseHubEventAsync("DefenseMinuteAutosaved", new { CommitteeId = committeeId, AssignmentId = request.AssignmentId, IntervalSeconds = 30 }, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.1"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> SubmitIndependentScoreAsync(int committeeId, LecturerScoreSubmitDto request, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var requestHash = ComputeRequestHash("UC3.SUBMIT_INDEPENDENT_SCORE", committeeId, lecturerCode, request.AssignmentId, request.Score, request.Comment ?? string.Empty);
            var replay = await TryReplayResponseAsync<bool>("SUBMIT_INDEPENDENT_SCORE", committeeId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _scoreWorkflowService.SubmitIndependentScoreAsync(committeeId, request, lecturerCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Scoring.SubmitSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.2"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("SUBMIT_INDEPENDENT_SCORE", committeeId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        public async Task<ApiResponse<bool>> RequestReopenScoreAsync(int committeeId, ReopenScoreRequestDto request, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var requestHash = ComputeRequestHash("UC3.REQUEST_REOPEN", committeeId, lecturerCode, request.AssignmentId, request.Reason ?? string.Empty);
            var replay = await TryReplayResponseAsync<bool>("REQUEST_REOPEN_SCORE", committeeId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _scoreWorkflowService.RequestReopenScoreAsync(committeeId, request, lecturerCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Scoring.ReopenSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.2"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("REQUEST_REOPEN_SCORE", committeeId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        public async Task<ApiResponse<bool>> LockSessionAsync(int committeeId, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var requestHash = ComputeRequestHash("UC3.LOCK_SESSION", committeeId, lecturerCode);
            var replay = await TryReplayResponseAsync<bool>("LOCK_SESSION", committeeId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _scoreWorkflowService.LockSessionAsync(committeeId, lecturerCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Scoring.LockSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.5"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("LOCK_SESSION", committeeId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        public async Task<ApiResponse<bool>> ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var requestHash = ComputeRequestHash("UC4.APPROVE_REVISION", revisionId, lecturerCode);
            var replay = await TryReplayResponseAsync<bool>("APPROVE_REVISION", revisionId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _revisionWorkflowService.ApproveRevisionAsync(revisionId, lecturerCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Revision.ApproveSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.1"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("APPROVE_REVISION", revisionId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        public async Task<ApiResponse<bool>> RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var requestHash = ComputeRequestHash("UC4.REJECT_REVISION", revisionId, lecturerCode, reason);
            var replay = await TryReplayResponseAsync<bool>("REJECT_REVISION", revisionId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _revisionWorkflowService.RejectRevisionAsync(revisionId, reason, lecturerCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Revision.RejectSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.1"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("REJECT_REVISION", revisionId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        public async Task<ApiResponse<bool>> SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, string studentCode, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default)
        {
            var file = request.File;
            var requestHash = ComputeRequestHash("UC4.SUBMIT_STUDENT_REVISION", request.AssignmentId, studentCode, request.RevisedContent ?? string.Empty, file?.FileName ?? string.Empty, file?.Length ?? 0);
            var replay = await TryReplayResponseAsync<bool>("SUBMIT_STUDENT_REVISION", request.AssignmentId, idempotencyKey, requestHash, cancellationToken);
            if (replay != null)
            {
                return replay;
            }

            ApiResponse<bool> response;
            try
            {
                await _revisionWorkflowService.SubmitStudentRevisionAsync(request, studentCode, actorUserId, cancellationToken);
                response = ApiResponse<bool>.SuccessResponse(true, code: DefenseUcErrorCodes.Revision.SubmitSuccess);
            }
            catch (BusinessRuleException ex)
            {
                response = Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.1"), ex.Details);
            }

            await SaveIdempotencyResponseAsync("SUBMIT_STUDENT_REVISION", request.AssignmentId, idempotencyKey, requestHash, response, cancellationToken);
            return response;
        }

        private async Task ApplyCouncilPayloadAsync(Committee committee, CouncilUpsertDto request, DateTime now, CancellationToken cancellationToken)
        {
            var topics = await _db.Topics.Where(x => request.MorningStudentCodes.Concat(request.AfternoonStudentCodes).Contains(x.ProposerStudentCode ?? string.Empty)).ToListAsync(cancellationToken);

            var topicByStudent = topics.Where(t => !string.IsNullOrWhiteSpace(t.ProposerStudentCode)).ToDictionary(t => t.ProposerStudentCode!, t => t, StringComparer.OrdinalIgnoreCase);

            var forbiddenSupervisors = topics
                .Select(x => x.SupervisorLecturerCode)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var member in request.Members)
            {
                if (forbiddenSupervisors.Contains(member.LecturerCode))
                {
                    throw new BusinessRuleException(
                        "GVHD của sinh viên trong hội đồng không được nằm trong thành viên hội đồng.",
                        "UC2.3.LECTURER_SUPERVISOR_CONFLICT",
                        new { member.LecturerCode });
                }
            }

            var lecturers = await _db.LecturerProfiles
                .Join(_db.Users, l => l.UserCode, u => u.UserCode, (l, u) => new { l, u })
                .Where(x => request.Members.Select(m => m.LecturerCode).Contains(x.l.LecturerCode))
                .Select(x => new { x.l.LecturerCode, x.l.LecturerProfileID, x.u.UserCode, x.u.UserID })
                .ToListAsync(cancellationToken);

            foreach (var member in request.Members)
            {
                var lecturer = lecturers.FirstOrDefault(x => string.Equals(x.LecturerCode, member.LecturerCode, StringComparison.OrdinalIgnoreCase));
                if (lecturer == null)
                {
                    throw new BusinessRuleException($"Không tìm thấy giảng viên {member.LecturerCode}.");
                }

                await _uow.CommitteeMembers.AddAsync(new CommitteeMember
                {
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    MemberLecturerCode = lecturer.LecturerCode,
                    MemberLecturerProfileID = lecturer.LecturerProfileID,
                    MemberUserCode = lecturer.UserCode,
                    MemberUserID = lecturer.UserID,
                    Role = NormalizeRole(member.Role),
                    IsChair = string.Equals(NormalizeRole(member.Role), "CT", StringComparison.OrdinalIgnoreCase),
                    CreatedAt = now,
                    LastUpdated = now
                });
            }

            var tagEntities = await _db.Tags.AsNoTracking().Where(t => request.CouncilTags.Contains(t.TagCode)).ToListAsync(cancellationToken);
            foreach (var tag in tagEntities)
            {
                await _uow.CommitteeTags.AddAsync(new CommitteeTag
                {
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    TagID = tag.TagID,
                    TagCode = tag.TagCode,
                    CreatedAt = now
                });
            }

            var morningStart = new TimeSpan(7, 30, 0);
            var afternoonStart = new TimeSpan(13, 30, 0);

            for (var i = 0; i < request.MorningStudentCodes.Count; i++)
            {
                var studentCode = request.MorningStudentCodes[i];
                if (!topicByStudent.TryGetValue(studentCode, out var topic))
                {
                    throw new BusinessRuleException($"Không tìm thấy đề tài cho sinh viên {studentCode}.");
                }

                await CreateAssignmentAsync(committee, topic, 1, morningStart.Add(TimeSpan.FromMinutes(i * 60)), now, cancellationToken);
            }

            for (var i = 0; i < request.AfternoonStudentCodes.Count; i++)
            {
                var studentCode = request.AfternoonStudentCodes[i];
                if (!topicByStudent.TryGetValue(studentCode, out var topic))
                {
                    throw new BusinessRuleException($"Không tìm thấy đề tài cho sinh viên {studentCode}.");
                }

                await CreateAssignmentAsync(committee, topic, 2, afternoonStart.Add(TimeSpan.FromMinutes(i * 60)), now, cancellationToken);
            }

            committee.Status = "Ready";
            _uow.Committees.Update(committee);
        }

        private async Task SaveCouncilTagsAsync(Committee committee, List<string> requestedTagCodes, DateTime now, CancellationToken cancellationToken)
        {
            var existingTags = await _db.CommitteeTags.Where(x => x.CommitteeID == committee.CommitteeID).ToListAsync(cancellationToken);
            if (existingTags.Count > 0)
            {
                _db.CommitteeTags.RemoveRange(existingTags);
            }

            var normalizedTagCodes = requestedTagCodes
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (normalizedTagCodes.Count == 0)
            {
                return;
            }

            var tagEntities = await _db.Tags.AsNoTracking()
                .Where(x => normalizedTagCodes.Contains(x.TagCode))
                .ToListAsync(cancellationToken);

            foreach (var tag in tagEntities)
            {
                await _uow.CommitteeTags.AddAsync(new CommitteeTag
                {
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    TagID = tag.TagID,
                    TagCode = tag.TagCode,
                    CreatedAt = now
                });
            }
        }

        private async Task SaveCouncilMembersAsync(Committee committee, List<CouncilMemberInputDto> members, DateTime now, CancellationToken cancellationToken)
        {
            var normalizedMembers = members
                .Where(x => !string.IsNullOrWhiteSpace(x.LecturerCode))
                .Select(x => new CouncilMemberInputDto
                {
                    LecturerCode = x.LecturerCode.Trim(),
                    Role = NormalizeRole(x.Role)
                })
                .ToList();

            var duplicateLecturer = normalizedMembers
                .GroupBy(x => x.LecturerCode, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateLecturer != null)
            {
                throw new BusinessRuleException("Không được trùng giảng viên trong cùng hội đồng.", "UC2.3.DUPLICATE_MEMBER", new { duplicateLecturer.Key });
            }

            var lecturerCodes = normalizedMembers.Select(x => x.LecturerCode).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var lecturers = await _db.LecturerProfiles
                .Join(_db.Users, l => l.UserCode, u => u.UserCode, (l, u) => new { l.LecturerCode, l.LecturerProfileID, u.UserCode, u.UserID })
                .Where(x => lecturerCodes.Contains(x.LecturerCode))
                .ToListAsync(cancellationToken);

            foreach (var member in normalizedMembers)
            {
                var lecturer = lecturers.FirstOrDefault(x => string.Equals(x.LecturerCode, member.LecturerCode, StringComparison.OrdinalIgnoreCase));
                if (lecturer == null)
                {
                    throw new BusinessRuleException($"Không tìm thấy giảng viên {member.LecturerCode}.", "UC2.3.LECTURER_NOT_FOUND");
                }

                await _uow.CommitteeMembers.AddAsync(new CommitteeMember
                {
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    MemberLecturerCode = lecturer.LecturerCode,
                    MemberLecturerProfileID = lecturer.LecturerProfileID,
                    MemberUserCode = lecturer.UserCode,
                    MemberUserID = lecturer.UserID,
                    Role = member.Role,
                    IsChair = string.Equals(member.Role, "CT", StringComparison.OrdinalIgnoreCase),
                    CreatedAt = now,
                    LastUpdated = now
                });
            }
        }

        private async Task SaveCouncilAssignmentsAsync(Committee committee, List<CouncilAssignmentInputDto> assignments, DateTime now, CancellationToken cancellationToken)
        {
            var normalizedAssignments = assignments
                .Where(x => !string.IsNullOrWhiteSpace(x.TopicCode))
                .Select(x => new
                {
                    TopicCode = x.TopicCode.Trim(),
                    Session = ToSessionNumber(x.SessionCode),
                    ScheduledAt = (x.ScheduledAt ?? committee.DefenseDate ?? now.Date).Date,
                    StartTime = ParseRequiredTime(x.StartTime, "UC2.3.INVALID_START_TIME"),
                    EndTime = ParseRequiredTime(x.EndTime, "UC2.3.INVALID_END_TIME"),
                    OrderIndex = x.OrderIndex
                })
                .ToList();

            var duplicateTopic = normalizedAssignments
                .GroupBy(x => x.TopicCode, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateTopic != null)
            {
                throw new BusinessRuleException("Không được gán trùng đề tài trong cùng hội đồng.", "UC2.3.DUPLICATE_TOPIC", new { duplicateTopic.Key });
            }

            if (normalizedAssignments.Any(x => x.EndTime <= x.StartTime))
            {
                throw new BusinessRuleException("endTime phải lớn hơn startTime.", "UC2.3.INVALID_TIME_RANGE");
            }

            var topicCodes = normalizedAssignments.Select(x => x.TopicCode).ToList();
            var topics = await _db.Topics.Where(x => topicCodes.Contains(x.TopicCode)).ToListAsync(cancellationToken);
            if (topics.Count != topicCodes.Count)
            {
                throw new BusinessRuleException("Có đề tài không tồn tại trong danh sách gán.", "UC2.3.TOPIC_NOT_FOUND");
            }

            await _constraintService.ValidateBeforeAssignmentAsync(
                committee.CommitteeID,
                topicCodes,
                normalizedAssignments.Select(x => (x.ScheduledAt.Date, x.Session)).Distinct().ToList(),
                cancellationToken);

            for (var i = 0; i < normalizedAssignments.Count; i++)
            {
                var row = normalizedAssignments[i];
                var topic = topics.First(x => string.Equals(x.TopicCode, row.TopicCode, StringComparison.OrdinalIgnoreCase));
                var orderIndex = row.OrderIndex ?? (i + 1);

                await _uow.DefenseAssignments.AddAsync(new DefenseAssignment
                {
                    AssignmentCode = $"AS{committee.CommitteeCode}_{topic.TopicCode}_{row.Session}_{orderIndex:D2}",
                    CommitteeID = committee.CommitteeID,
                    CommitteeCode = committee.CommitteeCode,
                    TopicID = topic.TopicID,
                    TopicCode = topic.TopicCode,
                    ScheduledAt = row.ScheduledAt,
                    Session = row.Session,
                    Shift = row.Session == 1 ? DefenseSessionCodes.Morning : DefenseSessionCodes.Afternoon,
                    OrderIndex = orderIndex,
                    StartTime = row.StartTime,
                    EndTime = row.EndTime,
                    AssignedBy = "admin",
                    AssignedAt = now,
                    Status = DefenseWorkflowStateMachine.ToValue(AssignmentStatus.Pending),
                    CreatedAt = now,
                    LastUpdated = now
                });

                MarkTopicAssigned(topic, now);
            }

            var committeeHasMembers = await _db.CommitteeMembers.AsNoTracking().AnyAsync(x => x.CommitteeID == committee.CommitteeID, cancellationToken);
            if (committeeHasMembers && normalizedAssignments.Count > 0)
            {
                committee.Status = DefenseWorkflowStateMachine.ToValue(CommitteeStatus.Ready);
                committee.LastUpdated = now;
                _uow.Committees.Update(committee);
            }
        }

        private async Task CreateAssignmentAsync(Committee committee, Topic topic, int session, TimeSpan start, DateTime now, CancellationToken cancellationToken)
        {
            await _uow.DefenseAssignments.AddAsync(new DefenseAssignment
            {
                AssignmentCode = $"AS{committee.CommitteeCode}_{topic.TopicCode}_{session}",
                CommitteeID = committee.CommitteeID,
                CommitteeCode = committee.CommitteeCode,
                TopicID = topic.TopicID,
                TopicCode = topic.TopicCode,
                ScheduledAt = committee.DefenseDate,
                Session = session,
                StartTime = start,
                EndTime = start.Add(TimeSpan.FromMinutes(60)),
                AssignedBy = "system",
                AssignedAt = now,
                Status = DefenseWorkflowStateMachine.ToValue(AssignmentStatus.Pending),
                CreatedAt = now,
                LastUpdated = now
            });

            MarkTopicAssigned(topic, now);
        }

        private void MarkTopicAssigned(Topic topic, DateTime now)
        {
            var tracked = _db.Topics.Local.FirstOrDefault(x => x.TopicCode == topic.TopicCode);
            if (tracked != null)
            {
                tracked.Status = "Đã phân hội đồng";
                tracked.LastUpdated = now;
                return;
            }

            topic.Status = "Đã phân hội đồng";
            topic.LastUpdated = now;
            _uow.Topics.Update(topic);
        }

        private async Task ValidateCouncilPayloadAsync(DefensePeriodConfigState config, CouncilUpsertDto request, CancellationToken cancellationToken)
        {
            var topicsPerSession = NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig);
            var membersPerCouncil = NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig);

            if (request.MorningStudentCodes.Count != topicsPerSession)
            {
                throw new BusinessRuleException($"Mỗi hội đồng phải có đúng {topicsPerSession} sinh viên buổi sáng.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
            }

            if (request.AfternoonStudentCodes.Count != topicsPerSession)
            {
                throw new BusinessRuleException($"Mỗi hội đồng phải có đúng {topicsPerSession} sinh viên buổi chiều.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
            }

            if (request.Members.Count != membersPerCouncil)
            {
                throw new BusinessRuleException($"Mỗi hội đồng phải có đúng {membersPerCouncil} thành viên.", "UC2.3.INVALID_MEMBER_COUNT");
            }

            var roles = request.Members.Select(x => NormalizeRole(x.Role)).ToList();
            ValidateRolePlan(roles, membersPerCouncil, "UC2.3.INVALID_ROLE_PLAN");

            var duplicateLecturer = request.Members.GroupBy(x => x.LecturerCode, StringComparer.OrdinalIgnoreCase).FirstOrDefault(g => g.Count() > 1);
            if (duplicateLecturer != null)
            {
                throw new BusinessRuleException("Không được trùng giảng viên trong cùng hội đồng.", "UC2.3.DUPLICATE_MEMBER", new { duplicateLecturer.Key });
            }

            var students = request.MorningStudentCodes.Concat(request.AfternoonStudentCodes).ToList();
            var expectedTotalTopics = topicsPerSession * 2;
            if (students.Distinct(StringComparer.OrdinalIgnoreCase).Count() != expectedTotalTopics)
            {
                throw new BusinessRuleException("Không được trùng sinh viên giữa 2 buổi.");
            }

            var selectedTopics = await _db.Topics.AsNoTracking()
                .Where(t => students.Contains(t.ProposerStudentCode ?? string.Empty))
                .ToListAsync(cancellationToken);
            if (selectedTopics.Count != expectedTotalTopics)
            {
                throw new BusinessRuleException("Danh sách sinh viên không hợp lệ hoặc chưa đủ điều kiện.");
            }

            var eligibleTopicCodes = await LoadEligibleTopicCodesFromMilestonesAsync(selectedTopics, cancellationToken);
            var ineligibleStudents = selectedTopics
                .Where(t => !eligibleTopicCodes.Contains(t.TopicCode))
                .Select(t => t.ProposerStudentCode ?? string.Empty)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (ineligibleStudents.Count > 0)
            {
                throw new BusinessRuleException(
                    "Danh sách sinh viên có đề tài chưa đạt điều kiện bảo vệ theo ProgressMilestones.",
                    details: new { Students = ineligibleStudents });
            }
        }

        private static void ValidatePeriodConfig(UpdateDefensePeriodConfigDto request, int topicsPerSession)
        {
            var rooms = request.Rooms.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToList();
            if (rooms.Count == 0)
            {
                throw new BusinessRuleException("Cần khai báo ít nhất 1 phòng bảo vệ.");
            }

            if (!TimeSpan.TryParse(request.MorningStart, out var morningStart))
            {
                throw new BusinessRuleException("morningStart không đúng định dạng HH:mm.");
            }

            if (!TimeSpan.TryParse(request.AfternoonStart, out var afternoonStart))
            {
                throw new BusinessRuleException("afternoonStart không đúng định dạng HH:mm.");
            }

            var effectiveTopicsPerSession = NormalizeTopicsPerSession(topicsPerSession);
            var morningEnd = morningStart.Add(SessionDuration.Multiply(effectiveTopicsPerSession));
            if (afternoonStart < morningEnd)
            {
                throw new BusinessRuleException("Khung giờ chiều bị chồng lấn với lịch sáng. afternoonStart phải >= giờ kết thúc buổi sáng.");
            }
        }

        private static void ValidateDefensePeriodWindow(DateTime startDate, DateTime? endDate)
        {
            if (endDate.HasValue && endDate.Value.Date < startDate.Date)
            {
                throw new BusinessRuleException("EndDate phải lớn hơn hoặc bằng StartDate.", "UC1.2.DATE_RANGE_INVALID");
            }
        }

        private static void EnsureCouncilDateWithinPeriod(DefenseTerm period, DateTime? defenseDate)
        {
            var startDate = period.StartDate.Date;
            var endDate = period.EndDate?.Date;
            if (!defenseDate.HasValue)
            {
                throw new BusinessRuleException("Ngày hội đồng là bắt buộc.", "UC2.3.DATE_REQUIRED");
            }

            var councilDate = defenseDate.Value.Date;

            if (councilDate < startDate)
            {
                throw new BusinessRuleException("Ngày hội đồng phải nằm trong khoảng ngày của đợt bảo vệ.", "UC2.3.DATE_BEFORE_PERIOD", new { councilDate, startDate, endDate });
            }

            if (endDate.HasValue && councilDate > endDate.Value)
            {
                throw new BusinessRuleException("Ngày hội đồng phải nằm trong khoảng ngày của đợt bảo vệ.", "UC2.3.DATE_AFTER_PERIOD", new { councilDate, startDate, endDate });
            }
        }

        private static async Task<RetryExecutionResult<T>> ExecuteWithRetryAsync<T>(Func<Task<T>> action, bool retryOnFailure, CancellationToken cancellationToken)
        {
            var maxAttempts = retryOnFailure ? 3 : 1;
            var lastException = (Exception?)null;
            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                try
                {
                    return new RetryExecutionResult<T>
                    {
                        Data = await action(),
                        Attempts = attempt
                    };
                }
                catch (Exception ex) when (attempt < maxAttempts)
                {
                    lastException = ex;
                    await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt), cancellationToken);
                }
            }

            throw lastException ?? new InvalidOperationException("Sync thất bại sau nhiều lần thử.");
        }

        private static Dictionary<string, bool> BuildSyncReadiness(DefensePeriodConfigState config, int eligibleCount)
        {
            return new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase)
            {
                ["module2Ready"] = config.LecturerCapabilitiesLocked && config.CouncilConfigConfirmed && eligibleCount > 0,
                ["hasEligibleTopics"] = eligibleCount > 0,
                ["lecturerCapabilitiesLocked"] = config.LecturerCapabilitiesLocked,
                ["councilConfigConfirmed"] = config.CouncilConfigConfirmed
            };
        }

        private async Task<string> GenerateUniqueCommitteeCodeAsync(int periodId, string? requestKey, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var year = now.Year;

            var expired = await _db.CommitteeCodeReservations
                .Where(x => x.ExpiresAt <= now && x.Status == "Reserved")
                .ToListAsync(cancellationToken);
            if (expired.Count > 0)
            {
                foreach (var item in expired)
                {
                    item.Status = "Expired";
                }

                await _db.SaveChangesAsync(cancellationToken);
            }

            if (!string.IsNullOrWhiteSpace(requestKey))
            {
                var existing = await _db.CommitteeCodeReservations.AsNoTracking()
                    .Where(x => x.PeriodId == periodId
                        && x.RequestKey == requestKey.Trim()
                        && (x.Status == "Reserved" || x.Status == "Committed")
                        && x.ExpiresAt > now)
                    .OrderByDescending(x => x.CommitteeCodeReservationId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existing != null)
                {
                    return existing.CommitteeCode;
                }
            }

            var maxSeq = await _db.CommitteeCodeReservations.AsNoTracking()
                .Where(x => x.Year == year)
                .Select(x => (int?)x.Sequence)
                .MaxAsync(cancellationToken) ?? 0;

            for (var attempt = 1; attempt <= 20; attempt++)
            {
                var seq = maxSeq + attempt;
                var code = $"HD-{year}-{seq:D4}";

                var existsInCommittee = await _db.Committees.AsNoTracking().AnyAsync(x => x.CommitteeCode == code, cancellationToken);
                var existsInReservation = await _db.CommitteeCodeReservations.AsNoTracking()
                    .AnyAsync(x => x.CommitteeCode == code && x.Status != "Expired" && x.ExpiresAt > now, cancellationToken);

                if (existsInCommittee || existsInReservation)
                {
                    continue;
                }

                await _db.CommitteeCodeReservations.AddAsync(new CommitteeCodeReservation
                {
                    PeriodId = periodId,
                    Year = year,
                    Sequence = seq,
                    CommitteeCode = code,
                    Status = "Reserved",
                    RequestKey = string.IsNullOrWhiteSpace(requestKey) ? null : requestKey.Trim(),
                    ReservedAt = now,
                    ExpiresAt = now.AddMinutes(10)
                }, cancellationToken);

                try
                {
                    await _db.SaveChangesAsync(cancellationToken);
                    return code;
                }
                catch
                {
                    // Retry next sequence on unique race.
                }
            }

            throw new BusinessRuleException("Không thể tạo mã hội đồng duy nhất. Vui lòng thử lại.", DefenseUcErrorCodes.AutoCode.ReservationFailed);
        }

        private async Task MarkCommitteeCodeReservationCommittedAsync(int periodId, string committeeCode, CancellationToken cancellationToken)
        {
            var reservation = await _db.CommitteeCodeReservations
                .Where(x => x.PeriodId == periodId && x.CommitteeCode == committeeCode)
                .OrderByDescending(x => x.CommitteeCodeReservationId)
                .FirstOrDefaultAsync(cancellationToken);

            if (reservation == null)
            {
                return;
            }

            reservation.Status = "Committed";
            reservation.CommittedAt = DateTime.UtcNow;
            reservation.ExpiresAt = DateTime.UtcNow.AddDays(3650);
            await _db.SaveChangesAsync(cancellationToken);
        }

        private async Task<string?> ValidateCouncilHardRulesAsync(int councilId, int topicsPerSession, int membersPerCouncil, CancellationToken cancellationToken)
        {
            var assignments = await _db.DefenseAssignments.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
            var members = await _db.CommitteeMembers.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);

            if (assignments.Count(x => x.Session == 1) != topicsPerSession || assignments.Count(x => x.Session == 2) != topicsPerSession)
            {
                return $"Mỗi hội đồng phải có {topicsPerSession} đề tài sáng và {topicsPerSession} đề tài chiều.";
            }

            if (members.Count != membersPerCouncil)
            {
                return $"Mỗi hội đồng phải có đúng {membersPerCouncil} thành viên.";
            }

            try
            {
                ValidateRolePlan(members.Select(x => NormalizeRole(x.Role)).ToList(), membersPerCouncil, "UC2.3.INVALID_ROLE_PLAN");
            }
            catch (BusinessRuleException ex)
            {
                return ex.Message;
            }

            try
            {
                await _constraintService.EnsureRequiredRolesAsync(councilId, cancellationToken);
            }
            catch (BusinessRuleException ex)
            {
                return ex.Message;
            }

            var topicCodes = assignments.Where(x => !string.IsNullOrWhiteSpace(x.TopicCode)).Select(x => x.TopicCode!).ToList();
            var forbiddenSupervisors = await _db.Topics.AsNoTracking()
                .Where(x => topicCodes.Contains(x.TopicCode))
                .Select(x => x.SupervisorLecturerCode)
                .Where(x => x != null)
                .Select(x => x!)
                .ToListAsync(cancellationToken);

            var conflict = members.Any(m => forbiddenSupervisors.Contains(m.MemberLecturerCode ?? string.Empty, StringComparer.OrdinalIgnoreCase));
            if (conflict)
            {
                return "Vi phạm ràng buộc GVHD không được nằm trong hội đồng của SV mình hướng dẫn.";
            }

            return null;
        }

        private async Task<CouncilDraftDto> BuildCouncilDtoAsync(int periodId, int councilId, string? manualWarning, CancellationToken cancellationToken)
        {
            var committee = await _db.Committees.AsNoTracking().FirstAsync(x => x.CommitteeID == councilId, cancellationToken);
            var assignments = await _db.DefenseAssignments.AsNoTracking().Where(x => x.CommitteeID == councilId).OrderBy(x => x.Session).ThenBy(x => x.StartTime).ToListAsync(cancellationToken);
            var members = await _db.CommitteeMembers.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
            var tagCodes = await _db.CommitteeTags.AsNoTracking().Where(x => x.CommitteeID == councilId).Select(x => x.TagCode).ToListAsync(cancellationToken);

            var topicCodes = assignments.Where(x => !string.IsNullOrWhiteSpace(x.TopicCode)).Select(x => x.TopicCode!).ToList();
            var topics = await _db.Topics.AsNoTracking().Where(x => topicCodes.Contains(x.TopicCode)).ToListAsync(cancellationToken);
            var studentCodes = topics.Where(x => !string.IsNullOrWhiteSpace(x.ProposerStudentCode)).Select(x => x.ProposerStudentCode!).ToList();
            var studentMap = await _db.StudentProfiles.AsNoTracking()
                .Where(x => studentCodes.Contains(x.StudentCode))
                .ToDictionaryAsync(x => x.StudentCode, x => x.FullName ?? x.StudentCode, cancellationToken);

            var forbidden = topics.Select(x => x.SupervisorLecturerCode).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            var lecturers = await _db.LecturerProfiles.AsNoTracking()
                .Select(l => new { l.LecturerCode, Name = l.FullName })
                .ToDictionaryAsync(x => x.LecturerCode, x => x.Name ?? x.LecturerCode, cancellationToken);

            var dto = new CouncilDraftDto
            {
                Id = committee.CommitteeID,
                CommitteeCode = committee.CommitteeCode,
                Name = committee.Name ?? committee.CommitteeCode,
                DefenseDate = committee.DefenseDate,
                ConcurrencyToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture),
                Room = committee.Room ?? string.Empty,
                SlotId = $"{committee.DefenseDate:yyyyMMdd}",
                CouncilTags = tagCodes,
                ForbiddenLecturers = forbidden,
                Members = members.Select(m => new CouncilMemberDto
                {
                    Role = NormalizeRole(m.Role),
                    LecturerCode = m.MemberLecturerCode ?? string.Empty,
                    LecturerName = lecturers.TryGetValue(m.MemberLecturerCode ?? string.Empty, out var n) ? n : (m.MemberLecturerCode ?? string.Empty)
                }).ToList(),
                Status = committee.Status ?? "Draft"
            };

            foreach (var assignment in assignments)
            {
                var topic = topics.FirstOrDefault(t => t.TopicCode == assignment.TopicCode);
                if (topic == null)
                {
                    continue;
                }

                var studentCode = topic.ProposerStudentCode ?? string.Empty;
                dto.Assignments.Add(new CouncilAssignmentDto
                {
                    AssignmentId = assignment.AssignmentID,
                    AssignmentCode = assignment.AssignmentCode,
                    TopicCode = topic.TopicCode,
                    TopicTitle = topic.Title,
                    StudentCode = studentCode,
                    StudentName = studentMap.TryGetValue(studentCode, out var studentName) ? studentName : studentCode,
                    Session = assignment.Session,
                    SessionCode = assignment.Session == 1 ? DefenseSessionCodes.Morning : DefenseSessionCodes.Afternoon,
                    ScheduledAt = assignment.ScheduledAt,
                    StartTime = assignment.StartTime?.ToString(@"hh\:mm"),
                    EndTime = assignment.EndTime?.ToString(@"hh\:mm"),
                    OrderIndex = assignment.OrderIndex,
                    Status = assignment.Status ?? string.Empty
                });
            }

            foreach (var assignment in assignments.Where(x => x.Session == 1))
            {
                var topic = topics.FirstOrDefault(t => t.TopicCode == assignment.TopicCode);
                if (topic == null)
                {
                    continue;
                }

                dto.MorningStudents.Add(new EligibleStudentDto
                {
                    StudentCode = topic.ProposerStudentCode ?? string.Empty,
                    StudentName = topic.ProposerStudentCode != null && studentMap.TryGetValue(topic.ProposerStudentCode, out var name) ? name : (topic.ProposerStudentCode ?? string.Empty),
                    TopicTitle = topic.Title,
                    SupervisorCode = topic.SupervisorLecturerCode,
                    IsEligible = true,
                    Valid = true
                });
            }

            foreach (var assignment in assignments.Where(x => x.Session == 2))
            {
                var topic = topics.FirstOrDefault(t => t.TopicCode == assignment.TopicCode);
                if (topic == null)
                {
                    continue;
                }

                dto.AfternoonStudents.Add(new EligibleStudentDto
                {
                    StudentCode = topic.ProposerStudentCode ?? string.Empty,
                    StudentName = topic.ProposerStudentCode != null && studentMap.TryGetValue(topic.ProposerStudentCode, out var name) ? name : (topic.ProposerStudentCode ?? string.Empty),
                    TopicTitle = topic.Title,
                    SupervisorCode = topic.SupervisorLecturerCode,
                    IsEligible = true,
                    Valid = true
                });
            }

            var config = ReadConfig(await EnsurePeriodAsync(periodId, cancellationToken));
            dto.Warning = manualWarning ?? await ValidateCouncilHardRulesAsync(
                councilId,
                NormalizeTopicsPerSession(config.CouncilConfig.TopicsPerSessionConfig),
                NormalizeMembersPerCouncil(config.CouncilConfig.MembersPerCouncilConfig),
                cancellationToken);
            if (!string.IsNullOrWhiteSpace(dto.Warning))
            {
                dto.Status = "Warning";
            }

            return dto;
        }

        private async Task<List<Committee>> GetPeriodCommitteesAsync(DefensePeriodConfigState config, CancellationToken cancellationToken)
        {
            if (config.CouncilIds.Count == 0)
            {
                return new List<Committee>();
            }

            return await _db.Committees.Where(x => config.CouncilIds.Contains(x.CommitteeID)).ToListAsync(cancellationToken);
        }

        private async Task<List<DefenseAssignment>> GetPeriodAssignmentsAsync(DefensePeriodConfigState config, CancellationToken cancellationToken)
        {
            if (config.CouncilIds.Count == 0)
            {
                return new List<DefenseAssignment>();
            }

            return await _db.DefenseAssignments.Where(x => x.CommitteeID.HasValue && config.CouncilIds.Contains(x.CommitteeID.Value)).ToListAsync(cancellationToken);
        }

        private async Task<DefenseTerm?> GetPeriodAsync(int periodId, CancellationToken cancellationToken)
        {
            return await _db.DefenseTerms.FirstOrDefaultAsync(x => x.DefenseTermId == periodId, cancellationToken);
        }

        private async Task<DefenseTerm> EnsurePeriodAsync(int periodId, CancellationToken cancellationToken)
        {
            var period = await GetPeriodAsync(periodId, cancellationToken);
            if (period == null)
            {
                throw new BusinessRuleException("Không tìm thấy đợt bảo vệ.");
            }

            return period;
        }

        private static DefensePeriodConfigState ReadConfig(DefenseTerm period)
        {
            if (string.IsNullOrWhiteSpace(period.ConfigJson))
            {
                return new DefensePeriodConfigState();
            }

            try
            {
                return JsonSerializer.Deserialize<DefensePeriodConfigState>(period.ConfigJson) ?? new DefensePeriodConfigState();
            }
            catch
            {
                return new DefensePeriodConfigState();
            }
        }

        private async Task AddAuditAsync(string action, string result, string records, CancellationToken cancellationToken)
        {
            await _auditTrailService.WriteAsync(action, result, null, null, new { Records = records }, null, cancellationToken);
        }

        private async Task AddAuditSnapshotAsync(
            string action,
            string result,
            object? before,
            object? after,
            object? details,
            int actorUserId,
            CancellationToken cancellationToken)
        {
            await _auditTrailService.WriteAsync(action, result, before, after, details, actorUserId, cancellationToken);
        }

        private async Task SendDefenseHubEventAsync(string eventName, object payload, CancellationToken cancellationToken)
        {
            await _resiliencePolicy.ExecuteAsync("DEFENSE_HUB_NOTIFY", async ct =>
            {
                await _hub.Clients.All.SendAsync(eventName, payload, ct);
            }, cancellationToken);
        }

        private static int NormalizeMembersPerCouncil(int value)
        {
            if (value < MinMembersPerCouncil || value > MaxMembersPerCouncil)
            {
                return 4;
            }

            return value;
        }

        private static int NormalizeTopicsPerSession(int value)
        {
            if (value < MinTopicsPerSession || value > MaxTopicsPerSession)
            {
                return 4;
            }

            return value;
        }

        private static List<string> BuildRolePlan(int membersPerCouncil)
        {
            var normalizedCount = NormalizeMembersPerCouncil(membersPerCouncil);
            var roles = new List<string> { "CT", "TK" };
            for (var i = 2; i < normalizedCount; i++)
            {
                roles.Add(i % 2 == 0 ? "PB" : "UV");
            }

            return roles;
        }

        private static void ValidateRolePlan(List<string> roles, int expectedCount, string errorCode)
        {
            ValidateRolePlanCore(roles, expectedCount, errorCode, requireExactCount: true);
        }

        private static void ValidateRolePlanPartial(List<string> roles, int maxCount, string errorCode)
        {
            ValidateRolePlanCore(roles, maxCount, errorCode, requireExactCount: false);
        }

        private static void ValidateRolePlanCore(List<string> roles, int expectedCount, string errorCode, bool requireExactCount)
        {
            var normalizedExpectedCount = NormalizeMembersPerCouncil(expectedCount);
            var normalizedRoles = roles.Select(NormalizeRole).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();

            if (requireExactCount && normalizedRoles.Count != normalizedExpectedCount)
            {
                throw new BusinessRuleException($"Số lượng thành viên phải đúng {normalizedExpectedCount}.", errorCode);
            }

            if (!requireExactCount && normalizedRoles.Count > normalizedExpectedCount)
            {
                throw new BusinessRuleException($"Số lượng thành viên vượt quá {normalizedExpectedCount}.", errorCode);
            }

            var invalidRole = normalizedRoles.FirstOrDefault(x => x != "CT" && x != "TK" && !AllowedAdditionalRoles.Contains(x, StringComparer.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(invalidRole))
            {
                throw new BusinessRuleException("Vai trò chỉ hỗ trợ CT, TK, PB, UV.", errorCode, new { Role = invalidRole });
            }

            var chairCount = normalizedRoles.Count(x => x == "CT");
            var secretaryCount = normalizedRoles.Count(x => x == "TK");
            if (chairCount > 1 || secretaryCount > 1)
            {
                throw new BusinessRuleException("Hội đồng chỉ được có tối đa 1 CT và 1 TK.", errorCode);
            }

            if (requireExactCount)
            {
                if (chairCount != 1 || secretaryCount != 1)
                {
                    throw new BusinessRuleException("Hội đồng phải có đúng 1 CT và 1 TK.", errorCode);
                }

                var additionalCount = normalizedRoles.Count(x => x == "PB" || x == "UV");
                if (additionalCount != normalizedExpectedCount - 2)
                {
                    throw new BusinessRuleException("Các thành viên còn lại phải thuộc vai trò PB hoặc UV.", errorCode);
                }
            }
        }

        private static void EnsureConcurrencyToken(Committee committee, string? requestToken)
        {
            if (string.IsNullOrWhiteSpace(requestToken))
            {
                throw new BusinessRuleException("Thiếu concurrencyToken khi cập nhật hội đồng.", "UC2.3.CONCURRENCY_TOKEN_REQUIRED");
            }

            var currentToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture);
            if (!string.Equals(currentToken, requestToken.Trim(), StringComparison.Ordinal))
            {
                throw new BusinessRuleException(
                    "Dữ liệu hội đồng đã thay đổi. Vui lòng tải lại trước khi lưu.",
                    "UC2.3.CONCURRENCY_CONFLICT",
                    new { currentToken, requestToken });
            }
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return string.Empty;
            }

            var upper = role.Trim().ToUpperInvariant();
            if (upper.Contains("CHU") || upper == "CT") return "CT";
            if (upper.Contains("THU") || upper == "TK") return "TK";
            if (upper.Contains("PHAN") || upper == "PB") return "PB";
            if (upper == "UV") return "UV";
            if (upper.Contains("GVHD")) return "GVHD";
            return upper;
        }

        private static string? ToGrade(decimal? score)
        {
            if (!score.HasValue) return null;
            var s = score.Value;
            if (s >= 9) return "A";
            if (s >= 7) return "B";
            if (s >= 5.5m) return "C";
            if (s >= 4) return "D";
            return "F";
        }

        private static TimeSpan ParseTime(string? value, TimeSpan fallback)
        {
            if (!string.IsNullOrWhiteSpace(value) && TimeSpan.TryParse(value, out var parsed))
            {
                return parsed;
            }

            return fallback;
        }

        private static TimeSpan ParseRequiredTime(string? value, string errorCode)
        {
            if (string.IsNullOrWhiteSpace(value) || !TimeSpan.TryParse(value, out var parsed))
            {
                throw new BusinessRuleException("Thời gian không hợp lệ, yêu cầu định dạng HH:mm.", errorCode);
            }

            return parsed;
        }

        private static int ToSessionNumber(string? sessionCode)
        {
            if (string.IsNullOrWhiteSpace(sessionCode))
            {
                return 1;
            }

            return string.Equals(sessionCode.Trim(), DefenseSessionCodes.Afternoon, StringComparison.OrdinalIgnoreCase) ? 2 : 1;
        }

        private async Task<HashSet<string>> LoadEligibleTopicCodesFromMilestonesAsync(IEnumerable<Topic> topics, CancellationToken cancellationToken)
        {
            var topicList = topics
                .Where(t => !string.IsNullOrWhiteSpace(t.TopicCode))
                .ToList();

            if (topicList.Count == 0)
            {
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            }

            var topicIds = topicList.Select(t => t.TopicID).Distinct().ToList();
            var latestMilestones = await _db.ProgressMilestones.AsNoTracking()
                .Where(x => topicIds.Contains(x.TopicID))
                .GroupBy(x => x.TopicID)
                .Select(g => g
                    .OrderByDescending(x => x.MilestoneID)
                    .Select(x => new
                    {
                        x.TopicID,
                        x.TopicCode,
                        x.MilestoneTemplateCode,
                        x.State
                    })
                    .First())
                .ToListAsync(cancellationToken);

            var eligibleTopicIds = latestMilestones
                .Where(x => IsEligibleMilestone(x.MilestoneTemplateCode, x.State))
                .Select(x => x.TopicID)
                .ToHashSet();

            var eligibleTopicCodes = topicList
                .Where(t => eligibleTopicIds.Contains(t.TopicID))
                .Select(t => t.TopicCode)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var milestone in latestMilestones)
            {
                if (!string.IsNullOrWhiteSpace(milestone.TopicCode) && IsEligibleMilestone(milestone.MilestoneTemplateCode, milestone.State))
                {
                    eligibleTopicCodes.Add(milestone.TopicCode);
                }
            }

            return eligibleTopicCodes;
        }

        private static bool IsEligibleMilestone(string? milestoneTemplateCode, string? state)
        {
            if (string.Equals(milestoneTemplateCode, "MS_PROG1", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.IsNullOrWhiteSpace(state))
            {
                return false;
            }

            return state.IndexOf("đủ điều kiện bảo vệ", StringComparison.OrdinalIgnoreCase) >= 0
                || state.IndexOf("eligible", StringComparison.OrdinalIgnoreCase) >= 0
                || state.IndexOf("đề tài đã duyệt", StringComparison.OrdinalIgnoreCase) >= 0
                || state.IndexOf("approved", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private async Task<Dictionary<string, HashSet<string>>> LoadTopicTagMapAsync(List<string> topicCodes, CancellationToken cancellationToken)
        {
            if (topicCodes.Count == 0)
            {
                return new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            }

            var rows = await _db.TopicTags.AsNoTracking()
                .Where(x => x.TopicCode != null && topicCodes.Contains(x.TopicCode))
                .Join(_db.Tags.AsNoTracking(), tt => tt.TagID, tg => tg.TagID, (tt, tg) => new { tt.TopicCode, tg.TagCode })
                .ToListAsync(cancellationToken);

            return rows
                .Where(x => !string.IsNullOrWhiteSpace(x.TopicCode))
                .GroupBy(x => x.TopicCode!, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase),
                    StringComparer.OrdinalIgnoreCase);
        }

        private static string ResolveUcCode(string? code, string fallbackUc)
        {
            if (string.IsNullOrWhiteSpace(code) || string.Equals(code, "BUSINESS_RULE_VIOLATION", StringComparison.OrdinalIgnoreCase))
            {
                return fallbackUc;
            }

            return code;
        }

        private async Task<bool> IsIdempotentReplayAsync(string action, int periodId, string? key, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return false;
            }

            var now = DateTime.UtcNow;
            var normalizedKey = key.Trim();

            var replay = await _db.IdempotencyRecords.AsNoTracking().AnyAsync(
                x => x.Action == action
                    && x.PeriodID == periodId
                    && x.RequestKey == normalizedKey
                    && x.ExpiresAt > now,
                cancellationToken);

            if (replay)
            {
                return true;
            }

            var expiredRows = await _db.IdempotencyRecords
                .Where(x => x.ExpiresAt <= now)
                .ToListAsync(cancellationToken);

            if (expiredRows.Count > 0)
            {
                _db.IdempotencyRecords.RemoveRange(expiredRows);
            }

            await _db.IdempotencyRecords.AddAsync(new IdempotencyRecord
            {
                Action = action,
                PeriodID = periodId,
                RequestKey = normalizedKey,
                RequestHash = ComputeRequestHash(action, periodId, normalizedKey, "PRECHECK"),
                CreatedAt = now,
                ExpiresAt = now.AddHours(2)
            }, cancellationToken);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
                return false;
            }
            catch
            {
                return true;
            }
        }

        private static string ComputeRequestHash(params object?[] parts)
        {
            var payload = string.Join("|", parts.Select(p => p?.ToString() ?? string.Empty));
            var bytes = Encoding.UTF8.GetBytes(payload);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash);
        }

        private async Task<ApiResponse<T>?> TryReplayResponseAsync<T>(string action, int scopeId, string? idempotencyKey, string requestHash, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var normalizedKey = idempotencyKey.Trim();

            var record = await _db.IdempotencyRecords
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.Action == action
                        && x.PeriodID == scopeId
                        && x.RequestKey == normalizedKey
                        && x.ExpiresAt > now,
                    cancellationToken);

            if (record == null)
            {
                return null;
            }

            if (!string.Equals(record.RequestHash, requestHash, StringComparison.Ordinal))
            {
                throw new BusinessRuleException(
                    "Idempotency-Key đã được dùng cho payload khác.",
                    DefenseUcErrorCodes.Idempotency.KeyReusedDifferentPayload,
                    new { action, scopeId });
            }

            if (!string.IsNullOrWhiteSpace(record.ResponsePayload))
            {
                var replay = JsonSerializer.Deserialize<ApiResponse<T>>(record.ResponsePayload!);
                if (replay != null)
                {
                    replay.IdempotencyReplay = true;
                    replay.Code ??= $"{action}.REPLAY";
                    replay.HttpStatusCode = replay.HttpStatusCode == 0
                        ? (record.ResponseStatusCode ?? (replay.Success ? 200 : 400))
                        : replay.HttpStatusCode;
                    return replay;
                }
            }

            if (record.RecordStatus == IdempotencyRecordStatus.Processing)
            {
                throw new BusinessRuleException(
                    "Yêu cầu cùng Idempotency-Key đang được xử lý, vui lòng thử lại sau.",
                    DefenseUcErrorCodes.Idempotency.RequestInProgress);
            }

            return null;
        }

        private async Task SaveIdempotencyResponseAsync<T>(string action, int scopeId, string? idempotencyKey, string requestHash, ApiResponse<T> response, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return;
            }

            var now = DateTime.UtcNow;
            var normalizedKey = idempotencyKey.Trim();

            var record = await _db.IdempotencyRecords.FirstOrDefaultAsync(
                x => x.Action == action
                    && x.PeriodID == scopeId
                    && x.RequestKey == normalizedKey,
                cancellationToken);

            if (record == null)
            {
                record = new IdempotencyRecord
                {
                    Action = action,
                    PeriodID = scopeId,
                    RequestKey = normalizedKey,
                    RequestHash = requestHash,
                    CreatedAt = now,
                    ExpiresAt = now.AddHours(2)
                };
                await _db.IdempotencyRecords.AddAsync(record, cancellationToken);
            }
            else if (!string.Equals(record.RequestHash, requestHash, StringComparison.Ordinal))
            {
                throw new BusinessRuleException(
                    "Idempotency-Key đã được dùng cho payload khác.",
                    DefenseUcErrorCodes.Idempotency.KeyReusedDifferentPayload,
                    new { action, scopeId });
            }

            record.ResponsePayload = JsonSerializer.Serialize(response);
            record.ResponseStatusCode = response.HttpStatusCode == 0 ? (response.Success ? 200 : 400) : response.HttpStatusCode;
            record.ResponseSuccess = response.Success;
            record.RecordStatus = response.Success ? IdempotencyRecordStatus.Completed : IdempotencyRecordStatus.Failed;
            record.CompletedAt = DateTime.UtcNow;
            record.ExpiresAt = now.AddHours(2);

            await _db.SaveChangesAsync(cancellationToken);
        }

        private static ApiResponse<T> Fail<T>(string message, int statusCode, string? code = null, object? details = null)
        {
            var resolvedCode = string.IsNullOrWhiteSpace(code) ? DefenseUcErrorCodes.Common.BusinessRuleViolation : code;
            if (resolvedCode.Contains("CONCURRENCY", StringComparison.OrdinalIgnoreCase))
            {
                statusCode = 409;
            }

            var normalizedMessage = message.StartsWith("[", StringComparison.Ordinal) ? message : $"[{resolvedCode}] {message}";
            return new ApiResponse<T>
            {
                Success = false,
                HttpStatusCode = statusCode,
                Message = normalizedMessage,
                Code = resolvedCode,
                Errors = details
            };
        }
    }
}

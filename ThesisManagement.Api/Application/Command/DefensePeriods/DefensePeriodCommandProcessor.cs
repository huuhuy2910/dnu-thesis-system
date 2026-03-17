using System.Text;
using System.Text.Json;
using System.Linq.Expressions;
using System.Collections.Concurrent;
using System.Globalization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
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
        Task<ApiResponse<bool>> FinalizeAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> PublishScoresAsync(int periodId, int actorUserId, string? idempotencyKey = null, CancellationToken cancellationToken = default);

        Task<ApiResponse<bool>> SaveLecturerMinuteAsync(int committeeId, UpdateLecturerMinutesDto request, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> SubmitIndependentScoreAsync(int committeeId, LecturerScoreSubmitDto request, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RequestReopenScoreAsync(int committeeId, ReopenScoreRequestDto request, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> LockSessionAsync(int committeeId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);

        Task<ApiResponse<bool>> SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, IFormFile file, string studentCode, int actorUserId, CancellationToken cancellationToken = default);
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
        private static readonly ConcurrentDictionary<string, DateTime> IdempotencyRegistry = new(StringComparer.OrdinalIgnoreCase);

        private sealed class RetryExecutionResult<T>
        {
            public T Data { get; init; } = default!;
            public int Attempts { get; init; }
        }

        private static readonly string[] RequiredRoles = new[] { "CT", "TK", "PB", "UV" };
        private const int SessionSlotsPerHalfDay = 4;
        private static readonly TimeSpan SessionDuration = TimeSpan.FromMinutes(60);
        private readonly ApplicationDbContext _db;
        private readonly IUnitOfWork _uow;
        private readonly IWebHostEnvironment _env;
        private readonly IHubContext<ChatHub> _hub;

        public DefensePeriodCommandProcessor(
            ApplicationDbContext db,
            IUnitOfWork uow,
            IWebHostEnvironment env,
            IHubContext<ChatHub> hub)
        {
            _db = db;
            _uow = uow;
            _env = env;
            _hub = hub;
        }

        public async Task<ApiResponse<SyncDefensePeriodResponseDto>> SyncAsync(int periodId, SyncDefensePeriodRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (IsIdempotentReplay("SYNC_INPUT", periodId, request.IdempotencyKey))
            {
                return ApiResponse<SyncDefensePeriodResponseDto>.SuccessResponse(new SyncDefensePeriodResponseDto
                {
                    Message = "Idempotent replay detected. Existing sync request was already processed."
                });
            }

            var period = await GetPeriodAsync(periodId, cancellationToken);
            if (period == null)
            {
                return Fail<SyncDefensePeriodResponseDto>("Không tìm thấy đợt bảo vệ", 404);
            }
            try
            {
                var retryResult = await ExecuteWithRetryAsync(
                    async () => await _db.Topics.AsNoTracking().ToListAsync(cancellationToken),
                    request.RetryOnFailure,
                    cancellationToken);

                var topics = retryResult.Data;
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

                    if (!IsEligibleTopic(topic))
                    {
                        errors.Add($"Trạng thái không hợp lệ: {topic.Status ?? "NULL"}");
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

                var auditPayload = new
                {
                    PeriodId = periodId,
                    EligibleCount = eligibleCount,
                    InvalidCount = invalidCount,
                    Attempts = retryResult.Attempts,
                    RowErrorSample = rowErrors.Take(100).ToList(),
                    Actor = actorUserId
                };

                await AddAuditAsync("SYNC_INPUT", "SUCCESS", JsonSerializer.Serialize(auditPayload), cancellationToken);

                return ApiResponse<SyncDefensePeriodResponseDto>.SuccessResponse(new SyncDefensePeriodResponseDto
                {
                    TotalPulled = topics.Count,
                    EligibleCount = eligibleCount,
                    InvalidCount = invalidCount,
                    RetryAttempts = retryResult.Attempts,
                    RowErrors = rowErrors,
                    Message = retryResult.Attempts > 1
                        ? $"Sync completed after {retryResult.Attempts} attempts."
                        : "Sync completed."
                });
            }
            catch (OperationCanceledException)
            {
                await AddAuditAsync("SYNC_INPUT", "TIMEOUT", $"period={periodId};actor={actorUserId}", CancellationToken.None);
                return Fail<SyncDefensePeriodResponseDto>("Sync timeout. Vui lòng thử lại.", 408, "SYNC_TIMEOUT");
            }
            catch (Exception ex)
            {
                await AddAuditAsync("SYNC_INPUT", "FAILED", $"period={periodId};actor={actorUserId};error={ex.Message}", CancellationToken.None);
                return Fail<SyncDefensePeriodResponseDto>("Sync thất bại. Vui lòng thử lại.", 500, "SYNC_FAILED");
            }
        }

        public async Task<ApiResponse<bool>> UpdateConfigAsync(int periodId, UpdateDefensePeriodConfigDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);

                ValidatePeriodConfig(request);

                config.Rooms = request.Rooms.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                config.MorningStart = request.MorningStart;
                config.AfternoonStart = request.AfternoonStart;
                config.SoftMaxCapacity = request.SoftMaxCapacity;

                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await AddAuditAsync("UPDATE_PERIOD_CONFIG", "SUCCESS", $"period={periodId};actor={actorUserId}", cancellationToken);
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
                await AddAuditAsync("UPDATE_LECTURER_BUSY_SLOTS", "SUCCESS", $"period={periodId};lecturer={lecturerCode};slotCount={normalizedSlots.Count};actor={actorUserId}", cancellationToken);
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
                config.LecturerCapabilitiesLocked = true;
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;
                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();

                await AddAuditAsync("LOCK_LECTURER_CAPABILITIES", "SUCCESS", $"period={periodId};actor={actorUserId}", cancellationToken);
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
                if (request.TopicsPerSessionConfig < 3 || request.TopicsPerSessionConfig > 7)
                {
                    throw new BusinessRuleException("topicsPerSessionConfig phải trong khoảng 3-7.");
                }

                if (request.MembersPerCouncilConfig < 3 || request.MembersPerCouncilConfig > 7)
                {
                    throw new BusinessRuleException("membersPerCouncilConfig phải trong khoảng 3-7.");
                }

                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
                config.CouncilConfig = request;
                config.CouncilConfigConfirmed = true;
                period.ConfigJson = JsonSerializer.Serialize(config);
                period.LastUpdated = DateTime.UtcNow;

                _uow.DefenseTerms.Update(period);
                await _uow.SaveChangesAsync();
                await AddAuditAsync("CONFIRM_COUNCIL_CONFIG", "SUCCESS", $"period={periodId};actor={actorUserId}", cancellationToken);

                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.1"), ex.Details);
            }
        }

        public async Task<ApiResponse<List<CouncilDraftDto>>> GenerateCouncilsAsync(int periodId, GenerateCouncilsRequestDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (IsIdempotentReplay("GENERATE_COUNCILS", periodId, request.IdempotencyKey))
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

                return ApiResponse<List<CouncilDraftDto>>.SuccessResponse(replayData);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
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

                var eligibleTopics = await _db.Topics
                    .AsNoTracking()
                    .Where(IsEligibleTopicExpression())
                    .OrderBy(t => t.TopicCode)
                    .ToListAsync(cancellationToken);

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
                var lecturerTagMap = await _db.LecturerTags
                    .AsNoTracking()
                    .Where(x => lecturerCodes.Contains(x.LecturerCode ?? string.Empty))
                    .Join(_db.Tags.AsNoTracking(), lt => lt.TagID, tg => tg.TagID, (lt, tg) => new { lt.LecturerCode, tg.TagCode })
                    .GroupBy(x => x.LecturerCode!)
                    .ToDictionaryAsync(g => g.Key, g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase), cancellationToken);

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

                for (var i = 0; i < topics.Count; i += 8)
                {
                    var chunk = topics.Skip(i).Take(8).ToList();
                    if (chunk.Count < 8)
                    {
                        break;
                    }

                    var room = selectedRooms[roomIndex % selectedRooms.Count];
                    roomIndex++;

                    var committee = new Committee
                    {
                        CommitteeCode = $"PER{periodId:D3}C{councilIndex:D3}",
                        Name = $"Hội đồng {councilIndex}",
                        DefenseDate = period.StartDate.Date,
                        Room = room,
                        Status = "Draft",
                        CreatedAt = now,
                        LastUpdated = now
                    };

                    await _uow.Committees.AddAsync(committee);
                    await _uow.SaveChangesAsync();

                    config.CouncilIds.Add(committee.CommitteeID);

                    var morning = chunk.Take(4).ToList();
                    var afternoon = chunk.Skip(4).Take(4).ToList();
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

                    var availableLecturers = lecturers
                        .Where(l => !allCodes.Contains(l.LecturerCode))
                        .OrderByDescending(l => lecturerTagMap.TryGetValue(l.LecturerCode, out var tags) ? tags.Count(t => desiredCouncilTags.Contains(t)) : 0)
                        .ThenBy(l => l.LecturerCode)
                        .Take(4)
                        .ToList();

                    var rolePlan = RequiredRoles.ToList();
                    var warning = string.Empty;

                    if (availableLecturers.Count < 4)
                    {
                        warning = "Không đủ giảng viên phù hợp theo ràng buộc GVHD/Tag.";
                    }

                    for (var m = 0; m < Math.Min(availableLecturers.Count, 4); m++)
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
                    }

                    if (availableLecturers.Count == 4)
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

                await AddAuditAsync("GENERATE_COUNCILS", "SUCCESS", $"period={periodId};count={councils.Count};actor={actorUserId}", cancellationToken);
                await tx.CommitAsync(cancellationToken);
                await _hub.Clients.All.SendAsync("DefenseCouncilsGenerated", new { PeriodId = periodId, Count = councils.Count }, cancellationToken);

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

                await ValidateCouncilPayloadAsync(request, cancellationToken);

                var now = DateTime.UtcNow;
                var uniqueCommitteeCode = await GenerateUniqueCommitteeCodeAsync(periodId, cancellationToken);
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
                await AddAuditAsync("CREATE_COUNCIL", "SUCCESS", $"period={periodId};council={committee.CommitteeID};actor={actorUserId}", cancellationToken);

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

                await ValidateCouncilPayloadAsync(request, cancellationToken);

                var committee = await _db.Committees.FirstOrDefaultAsync(x => x.CommitteeID == councilId, cancellationToken);
                if (committee == null)
                {
                    throw new BusinessRuleException("Không tìm thấy hội đồng.");
                }

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
                await AddAuditAsync("UPDATE_COUNCIL", "SUCCESS", $"period={periodId};council={councilId};actor={actorUserId}", cancellationToken);

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
                await AddAuditAsync("DELETE_COUNCIL", "SUCCESS", $"period={periodId};council={councilId};actor={actorUserId}", cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC2.3"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> FinalizeAsync(int periodId, FinalizeDefensePeriodDto request, int actorUserId, CancellationToken cancellationToken = default)
        {
            if (IsIdempotentReplay("FINALIZE", periodId, request.IdempotencyKey))
            {
                return ApiResponse<bool>.SuccessResponse(true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);

                var councils = await GetPeriodCommitteesAsync(config, cancellationToken);
                var warnings = new List<string>();
                foreach (var committee in councils)
                {
                    var validation = await ValidateCouncilHardRulesAsync(committee.CommitteeID, cancellationToken);
                    if (!string.IsNullOrWhiteSpace(validation))
                    {
                        warnings.Add($"{committee.CommitteeCode}: {validation}");
                        committee.Status = "Warning";
                    }
                    else if (string.Equals(committee.Status, "Draft", StringComparison.OrdinalIgnoreCase))
                    {
                        committee.Status = "Ready";
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

                await AddAuditAsync("FINALIZE", "SUCCESS", $"period={periodId};warningCount={warnings.Count};actor={actorUserId}", cancellationToken);
                await _hub.Clients.All.SendAsync("DefensePeriodFinalized", new { PeriodId = periodId, WarningCount = warnings.Count }, cancellationToken);

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
            if (IsIdempotentReplay("PUBLISH_SCORES", periodId, idempotencyKey))
            {
                return ApiResponse<bool>.SuccessResponse(true);
            }

            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var period = await EnsurePeriodAsync(periodId, cancellationToken);
                var config = ReadConfig(period);
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

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditAsync("PUBLISH_SCORES", "SUCCESS", $"period={periodId};actor={actorUserId}", cancellationToken);
                await _hub.Clients.All.SendAsync("DefenseScoresPublished", new { PeriodId = periodId }, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.3"), ex.Details);
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
                await _hub.Clients.All.SendAsync("DefenseMinuteAutosaved", new { CommitteeId = committeeId, AssignmentId = request.AssignmentId, IntervalSeconds = 30 }, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.1"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> SubmitIndependentScoreAsync(int committeeId, LecturerScoreSubmitDto request, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var assignment = await _db.DefenseAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.AssignmentID == request.AssignmentId && x.CommitteeID == committeeId, cancellationToken);
                if (assignment == null)
                {
                    throw new BusinessRuleException("Assignment không thuộc hội đồng.");
                }

                var member = await _db.CommitteeMembers.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.CommitteeID == committeeId && x.MemberLecturerCode == lecturerCode, cancellationToken);
                if (member == null)
                {
                    throw new BusinessRuleException("Giảng viên không thuộc hội đồng.");
                }

                var result = await _db.DefenseResults.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                if (result != null && result.IsLocked)
                {
                    throw new BusinessRuleException("Phiên điểm đang bị khóa, cần mở khóa trước khi chỉnh sửa điểm.");
                }

                var score = await _db.DefenseScores.FirstOrDefaultAsync(x => x.AssignmentID == request.AssignmentId && x.MemberLecturerCode == lecturerCode, cancellationToken);
                if (score == null)
                {
                    score = new DefenseScore
                    {
                        ScoreCode = $"SC{DateTime.UtcNow:yyyyMMddHHmmssfff}",
                        AssignmentID = request.AssignmentId,
                        AssignmentCode = assignment.AssignmentCode,
                        MemberLecturerProfileID = member.MemberLecturerProfileID,
                        MemberLecturerCode = lecturerCode,
                        MemberLecturerUserID = member.MemberUserID,
                        MemberLecturerUserCode = member.MemberUserCode,
                        Role = NormalizeRole(member.Role),
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.DefenseScores.AddAsync(score);
                }
                else if (score.IsSubmitted)
                {
                    throw new BusinessRuleException("Biểu mẫu chấm điểm cá nhân đã khóa sau khi submit. Cần Chủ tịch mở lại để chỉnh sửa.");
                }

                score.Score = request.Score;
                score.Comment = request.Comment;
                score.IsSubmitted = true;
                score.LastUpdated = DateTime.UtcNow;
                if (score.ScoreID > 0)
                {
                    _uow.DefenseScores.Update(score);
                }

                await _uow.SaveChangesAsync();

                var scores = await _db.DefenseScores.Where(x => x.AssignmentID == request.AssignmentId && x.IsSubmitted).Select(x => x.Score).ToListAsync(cancellationToken);
                if (scores.Count >= 2)
                {
                    var variance = scores.Max() - scores.Min();
                    if (variance > 1.5m)
                    {
                        result = await _db.DefenseResults.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                        if (result == null)
                        {
                            result = new DefenseResult
                            {
                                AssignmentId = request.AssignmentId,
                                IsLocked = true,
                                CreatedAt = DateTime.UtcNow,
                                LastUpdated = DateTime.UtcNow
                            };
                            await _uow.DefenseResults.AddAsync(result);
                        }
                        else
                        {
                            result.IsLocked = true;
                            result.LastUpdated = DateTime.UtcNow;
                            _uow.DefenseResults.Update(result);
                        }

                        await _uow.SaveChangesAsync();
                        await _hub.Clients.All.SendAsync("DefenseScoreVarianceAlert", new { CommitteeId = committeeId, AssignmentId = request.AssignmentId, Variance = variance }, cancellationToken);
                    }
                }

                await tx.CommitAsync(cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.2"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> RequestReopenScoreAsync(int committeeId, ReopenScoreRequestDto request, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var assignment = await _db.DefenseAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.AssignmentID == request.AssignmentId && x.CommitteeID == committeeId, cancellationToken);
                if (assignment == null)
                {
                    throw new BusinessRuleException("Assignment không thuộc hội đồng.");
                }

                var member = await _db.CommitteeMembers.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.CommitteeID == committeeId && x.MemberLecturerCode == lecturerCode, cancellationToken);
                if (member == null)
                {
                    throw new BusinessRuleException("Giảng viên không thuộc hội đồng.");
                }

                if (NormalizeRole(member.Role) != "CT")
                {
                    throw new BusinessRuleException("Chỉ Chủ tịch hội đồng (CT) được yêu cầu mở lại biểu mẫu điểm.");
                }

                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    throw new BusinessRuleException("Lý do mở lại điểm là bắt buộc.");
                }

                var result = await _db.DefenseResults.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                if (result == null)
                {
                    result = new DefenseResult
                    {
                        AssignmentId = request.AssignmentId,
                        IsLocked = false,
                        CreatedAt = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow
                    };
                    await _uow.DefenseResults.AddAsync(result);
                }
                else
                {
                    result.IsLocked = false;
                    result.LastUpdated = DateTime.UtcNow;
                    _uow.DefenseResults.Update(result);
                }

                var assignmentScores = await _db.DefenseScores
                    .Where(x => x.AssignmentID == request.AssignmentId && x.IsSubmitted)
                    .ToListAsync(cancellationToken);
                foreach (var assignmentScore in assignmentScores)
                {
                    assignmentScore.IsSubmitted = false;
                    assignmentScore.LastUpdated = DateTime.UtcNow;
                    _uow.DefenseScores.Update(assignmentScore);
                }

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await AddAuditAsync("REOPEN_SCORE_REQUEST", "APPROVED", $"committee={committeeId};assignment={request.AssignmentId};lecturer={lecturerCode};reason={request.Reason};actor={actorUserId}", cancellationToken);
                await _hub.Clients.All.SendAsync("DefenseScoreReopened", new { CommitteeId = committeeId, request.AssignmentId, request.Reason, LecturerCode = lecturerCode }, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.2"), ex.Details);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 500);
            }
        }

        public async Task<ApiResponse<bool>> LockSessionAsync(int committeeId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var chair = await _db.CommitteeMembers.AsNoTracking().FirstOrDefaultAsync(x => x.CommitteeID == committeeId && x.MemberLecturerCode == lecturerCode && x.Role != null && x.Role.ToUpper().Contains("CT"), cancellationToken);
                if (chair == null)
                {
                    throw new BusinessRuleException("Chỉ Chủ tịch hội đồng (CT) được khóa ca bảo vệ.");
                }

                var assignmentIds = await _db.DefenseAssignments.AsNoTracking().Where(x => x.CommitteeID == committeeId).Select(x => x.AssignmentID).ToListAsync(cancellationToken);
                var existingResults = await _db.DefenseResults.Where(x => assignmentIds.Contains(x.AssignmentId)).ToListAsync(cancellationToken);
                var existingResultIds = existingResults.Select(x => x.AssignmentId).ToHashSet();
                var now = DateTime.UtcNow;

                foreach (var result in existingResults)
                {
                    result.IsLocked = true;
                    result.LastUpdated = now;
                    _uow.DefenseResults.Update(result);
                }

                var missingIds = assignmentIds.Where(x => !existingResultIds.Contains(x)).ToList();
                foreach (var assignmentId in missingIds)
                {
                    await _uow.DefenseResults.AddAsync(new DefenseResult
                    {
                        AssignmentId = assignmentId,
                        IsLocked = true,
                        CreatedAt = now,
                        LastUpdated = now
                    });
                }

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);
                await AddAuditAsync("LOCK_SESSION", "SUCCESS", $"committee={committeeId};lecturer={lecturerCode};actor={actorUserId}", cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC3.5"), ex.Details);
            }
        }

        public async Task<ApiResponse<bool>> ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            return await UpdateRevisionStatusAsync(revisionId, lecturerCode, actorUserId, true, null, cancellationToken);
        }

        public async Task<ApiResponse<bool>> RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            return await UpdateRevisionStatusAsync(revisionId, lecturerCode, actorUserId, false, reason, cancellationToken);
        }

        public async Task<ApiResponse<bool>> SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, IFormFile file, string studentCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                if (file == null || file.Length == 0)
                {
                    throw new BusinessRuleException("File PDF là bắt buộc.");
                }

                if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                {
                    throw new BusinessRuleException("Chỉ chấp nhận file PDF.");
                }

                var assignment = await _db.DefenseAssignments
                    .Join(_db.Topics, a => a.TopicCode, t => t.TopicCode, (a, t) => new { Assignment = a, Topic = t })
                    .Where(x => x.Assignment.AssignmentID == request.AssignmentId && x.Topic.ProposerStudentCode == studentCode)
                    .Select(x => x.Assignment)
                    .FirstOrDefaultAsync(cancellationToken);

                if (assignment == null)
                {
                    throw new BusinessRuleException("Không tìm thấy assignment của sinh viên.");
                }

                var uploadDir = Path.Combine(_env.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot"), "uploads", "revisions");
                Directory.CreateDirectory(uploadDir);
                var fileName = $"rev_{request.AssignmentId}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
                var fullPath = Path.Combine(uploadDir, fileName);
                await using (var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    await file.CopyToAsync(fs, cancellationToken);
                }

                var revision = await _db.DefenseRevisions.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                if (revision == null)
                {
                    revision = new DefenseRevision
                    {
                        AssignmentId = request.AssignmentId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.DefenseRevisions.AddAsync(revision);
                }

                revision.RevisedContent = request.RevisedContent;
                revision.RevisionFileUrl = $"/uploads/revisions/{fileName}";
                revision.IsCtApproved = false;
                revision.IsGvhdApproved = false;
                revision.IsUvtkApproved = false;
                revision.FinalStatus = RevisionFinalStatus.Pending;
                revision.LastUpdated = DateTime.UtcNow;
                if (revision.Id > 0)
                {
                    _uow.DefenseRevisions.Update(revision);
                }

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);
                await AddAuditAsync("STUDENT_REVISION_SUBMIT", "SUCCESS", $"assignment={request.AssignmentId};student={studentCode};actor={actorUserId}", cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.1"), ex.Details);
            }
        }

        private async Task<ApiResponse<bool>> UpdateRevisionStatusAsync(int revisionId, string lecturerCode, int actorUserId, bool approved, string? reason, CancellationToken cancellationToken)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);
            try
            {
                var revision = await _db.DefenseRevisions.FirstOrDefaultAsync(x => x.Id == revisionId, cancellationToken);
                if (revision == null)
                {
                    throw new BusinessRuleException("Không tìm thấy revision.");
                }

                var assignment = await _db.DefenseAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.AssignmentID == revision.AssignmentId, cancellationToken);
                if (assignment == null || !assignment.CommitteeID.HasValue)
                {
                    throw new BusinessRuleException("Revision không thuộc hội đồng hợp lệ.");
                }

                var topic = await _db.Topics.AsNoTracking().FirstOrDefaultAsync(x => x.TopicCode == assignment.TopicCode, cancellationToken);
                if (topic == null)
                {
                    throw new BusinessRuleException("Không tìm thấy đề tài của revision.");
                }

                var member = await _db.CommitteeMembers.AsNoTracking()
                    .FirstOrDefaultAsync(x => x.CommitteeID == assignment.CommitteeID && x.MemberLecturerCode == lecturerCode, cancellationToken);
                var role = member != null ? NormalizeRole(member.Role) : string.Empty;
                var isSupervisor = !string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode)
                    && string.Equals(topic.SupervisorLecturerCode, lecturerCode, StringComparison.OrdinalIgnoreCase);
                var canApprove = role == "CT" || role == "TK" || isSupervisor;
                if (!canApprove)
                {
                    throw new BusinessRuleException("Giảng viên không có quyền duyệt revision này.");
                }

                if (!approved && string.IsNullOrWhiteSpace(reason))
                {
                    throw new BusinessRuleException("Lý do từ chối revision là bắt buộc.", "UC4.1.REJECT_REASON_REQUIRED");
                }

                if (role == "CT") revision.IsCtApproved = approved;
                if (role == "TK") revision.IsUvtkApproved = approved;
                if (isSupervisor) revision.IsGvhdApproved = approved;

                revision.FinalStatus = !approved
                    ? RevisionFinalStatus.Rejected
                    : (revision.IsCtApproved && revision.IsUvtkApproved && revision.IsGvhdApproved ? RevisionFinalStatus.Approved : RevisionFinalStatus.Pending);
                revision.LastUpdated = DateTime.UtcNow;
                _uow.DefenseRevisions.Update(revision);

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);
                var records = approved
                    ? $"revision={revisionId};lecturer={lecturerCode};actor={actorUserId}"
                    : $"revision={revisionId};lecturer={lecturerCode};reason={reason};actor={actorUserId}";
                await AddAuditAsync(approved ? "REVISION_APPROVE" : "REVISION_REJECT", "SUCCESS", records, cancellationToken);
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (BusinessRuleException ex)
            {
                await tx.RollbackAsync(cancellationToken);
                return Fail<bool>(ex.Message, 400, ResolveUcCode(ex.Code, "UC4.1"), ex.Details);
            }
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
                Status = "Assigned",
                CreatedAt = now,
                LastUpdated = now
            });

            topic.Status = "Đã phân hội đồng";
            topic.LastUpdated = now;
            _uow.Topics.Update(topic);
        }

        private async Task ValidateCouncilPayloadAsync(CouncilUpsertDto request, CancellationToken cancellationToken)
        {
            if (request.MorningStudentCodes.Count != 4)
            {
                throw new BusinessRuleException("Mỗi hội đồng phải có đúng 4 sinh viên buổi sáng.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
            }

            if (request.AfternoonStudentCodes.Count != 4)
            {
                throw new BusinessRuleException("Mỗi hội đồng phải có đúng 4 sinh viên buổi chiều.", "UC2.3.INVALID_TOPIC_COUNT_SESSION");
            }

            if (request.Members.Count != 4)
            {
                throw new BusinessRuleException("Mỗi hội đồng phải có đúng 4 thành viên.", "UC2.3.INVALID_MEMBER_COUNT");
            }

            var roles = request.Members.Select(x => NormalizeRole(x.Role)).ToList();
            var duplicateRole = roles
                .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault(g => g.Count() > 1);
            if (duplicateRole != null)
            {
                throw new BusinessRuleException("Không được trùng vai trò trong hội đồng.", "UC2.3.DUPLICATE_ROLE", new { Role = duplicateRole.Key });
            }

            var distinctRoles = roles.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (distinctRoles.Count != 4 || RequiredRoles.Any(required => !distinctRoles.Contains(required, StringComparer.OrdinalIgnoreCase)))
            {
                throw new BusinessRuleException("Thành viên hội đồng phải đủ vai trò CT/TK/PB/UV.");
            }

            var duplicateLecturer = request.Members.GroupBy(x => x.LecturerCode, StringComparer.OrdinalIgnoreCase).FirstOrDefault(g => g.Count() > 1);
            if (duplicateLecturer != null)
            {
                throw new BusinessRuleException("Không được trùng giảng viên trong cùng hội đồng.", "UC2.3.DUPLICATE_MEMBER", new { duplicateLecturer.Key });
            }

            var students = request.MorningStudentCodes.Concat(request.AfternoonStudentCodes).ToList();
            if (students.Distinct(StringComparer.OrdinalIgnoreCase).Count() != 8)
            {
                throw new BusinessRuleException("Không được trùng sinh viên giữa 2 buổi.");
            }

            var topicCount = await _db.Topics.AsNoTracking().CountAsync(t => students.Contains(t.ProposerStudentCode ?? string.Empty), cancellationToken);
            if (topicCount != 8)
            {
                throw new BusinessRuleException("Danh sách sinh viên không hợp lệ hoặc chưa đủ điều kiện.");
            }
        }

        private static void ValidatePeriodConfig(UpdateDefensePeriodConfigDto request)
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

            var morningEnd = morningStart.Add(SessionDuration.Multiply(SessionSlotsPerHalfDay));
            if (afternoonStart < morningEnd)
            {
                throw new BusinessRuleException("Khung giờ chiều bị chồng lấn với lịch sáng. afternoonStart phải >= giờ kết thúc buổi sáng.");
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

        private async Task<string> GenerateUniqueCommitteeCodeAsync(int periodId, CancellationToken cancellationToken)
        {
            var attempt = 0;
            while (attempt < 10)
            {
                attempt++;
                var candidate = $"PER{periodId:D3}M{DateTime.UtcNow:MMddHHmmss}{attempt:D2}";
                var exists = await _db.Committees.AsNoTracking().AnyAsync(x => x.CommitteeCode == candidate, cancellationToken);
                if (!exists)
                {
                    return candidate;
                }
            }

            throw new BusinessRuleException("Không thể tạo mã hội đồng duy nhất. Vui lòng thử lại.");
        }

        private async Task<string?> ValidateCouncilHardRulesAsync(int councilId, CancellationToken cancellationToken)
        {
            var assignments = await _db.DefenseAssignments.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
            var members = await _db.CommitteeMembers.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);

            if (assignments.Count(x => x.Session == 1) != 4 || assignments.Count(x => x.Session == 2) != 4)
            {
                return "Mỗi hội đồng phải có 4 đề tài sáng và 4 đề tài chiều.";
            }

            if (members.Count != 4)
            {
                return "Mỗi hội đồng phải có đúng 4 thành viên.";
            }

            var roles = members.Select(x => NormalizeRole(x.Role)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (RequiredRoles.Any(x => !roles.Contains(x, StringComparer.OrdinalIgnoreCase)))
            {
                return "Chưa đủ vai trò CT/TK/PB/UV.";
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

            dto.Warning = manualWarning ?? await ValidateCouncilHardRulesAsync(councilId, cancellationToken);
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
            await _uow.SyncAuditLogs.AddAsync(new SyncAuditLog
            {
                Action = action,
                Result = result,
                Records = records,
                Timestamp = DateTime.UtcNow
            });
            await _uow.SaveChangesAsync();
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

        private static Expression<Func<Topic, bool>> IsEligibleTopicExpression()
        {
            return t => t.Status == "Đủ điều kiện bảo vệ" || t.Status == "Eligible" || t.Status == "ELIGIBLE";
        }

        private static bool IsEligibleTopic(Topic topic)
        {
            return string.Equals(topic.Status, "Đủ điều kiện bảo vệ", StringComparison.OrdinalIgnoreCase)
                || string.Equals(topic.Status, "Eligible", StringComparison.OrdinalIgnoreCase)
                || string.Equals(topic.Status, "ELIGIBLE", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<Dictionary<string, HashSet<string>>> LoadTopicTagMapAsync(List<string> topicCodes, CancellationToken cancellationToken)
        {
            if (topicCodes.Count == 0)
            {
                return new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
            }

            return await _db.TopicTags.AsNoTracking()
                .Where(x => x.TopicCode != null && topicCodes.Contains(x.TopicCode))
                .Join(_db.Tags.AsNoTracking(), tt => tt.TagID, tg => tg.TagID, (tt, tg) => new { tt.TopicCode, tg.TagCode })
                .GroupBy(x => x.TopicCode!)
                .ToDictionaryAsync(
                    g => g.Key,
                    g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase),
                    cancellationToken);
        }

        private static string ResolveUcCode(string? code, string fallbackUc)
        {
            if (string.IsNullOrWhiteSpace(code) || string.Equals(code, "BUSINESS_RULE_VIOLATION", StringComparison.OrdinalIgnoreCase))
            {
                return fallbackUc;
            }

            return code;
        }

        private static bool IsIdempotentReplay(string action, int periodId, string? key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return false;
            }

            var now = DateTime.UtcNow;
            var expired = IdempotencyRegistry.Where(x => now - x.Value > TimeSpan.FromHours(2)).Select(x => x.Key).ToList();
            foreach (var oldKey in expired)
            {
                IdempotencyRegistry.TryRemove(oldKey, out _);
            }

            var requestKey = $"{action}:{periodId}:{key.Trim()}";
            return !IdempotencyRegistry.TryAdd(requestKey, now);
        }

        private static ApiResponse<T> Fail<T>(string message, int statusCode, string? code = null, object? details = null)
        {
            var resolvedCode = string.IsNullOrWhiteSpace(code) ? "BUSINESS_RULE_VIOLATION" : code;
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

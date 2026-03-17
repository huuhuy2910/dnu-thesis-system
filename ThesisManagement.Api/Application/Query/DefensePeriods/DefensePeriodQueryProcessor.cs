using System.Text;
using System.Text.Json;
using System.Globalization;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;
using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Application.Query.DefensePeriods
{
    public interface IDefensePeriodQueryProcessor
    {
        Task<ApiResponse<List<EligibleStudentDto>>> GetStudentsAsync(int periodId, bool eligibleOnly, CancellationToken cancellationToken = default);
        Task<ApiResponse<DefensePeriodConfigDto>> GetConfigAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<DefensePeriodStateDto>> GetStateAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<SyncErrorDetailDto>>> GetSyncErrorsAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> ExportSyncErrorsAsync(int periodId, string format, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<LecturerCapabilityDto>>> GetLecturerCapabilitiesAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<LecturerBusySlotsDto>>> GetLecturerBusySlotsAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<PagedResult<CouncilDraftDto>>> GetCouncilsAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default);
        Task<ApiResponse<CouncilDraftDto>> GetCouncilDetailAsync(int periodId, int councilId, CancellationToken cancellationToken = default);

        Task<ApiResponse<object>> GetLecturerCommitteesAsync(string lecturerCode, int? periodId = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<LecturerCommitteeMinuteDto>>> GetLecturerMinutesAsync(int committeeId, int? periodId = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<object>>> GetLecturerRevisionQueueAsync(string lecturerCode, int? periodId = null, CancellationToken cancellationToken = default);

        Task<ApiResponse<StudentDefenseInfoDtoV2>> GetStudentDefenseInfoAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<StudentNotificationDto>>> GetStudentNotificationsAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<object>>> GetStudentRevisionHistoryAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default);

        Task<ApiResponse<AnalyticsOverviewDto>> GetOverviewAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<CouncilAnalyticsDto>>> GetAnalyticsByCouncilAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<AnalyticsDistributionDto>> GetDistributionAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> BuildReportAsync(int periodId, string reportType, string format, int? councilId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<ExportHistoryDto>>> GetExportHistoryAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<PublishHistoryDto>>> GetPublishHistoryAsync(int periodId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<CouncilAuditHistoryDto>>> GetCouncilAuditHistoryAsync(int periodId, int? councilId, CancellationToken cancellationToken = default);
    }

    internal sealed class DefensePeriodConfigSnapshot
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

    public class DefensePeriodQueryProcessor : IDefensePeriodQueryProcessor
    {
        private sealed class CouncilSummaryRow
        {
            public int CouncilId { get; set; }
            public string Room { get; set; } = string.Empty;
            public int StudentCount { get; set; }
            public decimal Avg { get; set; }
            public decimal Max { get; set; }
            public decimal Min { get; set; }
        }

        private sealed class ScoreRowData
        {
            public int CouncilId { get; set; }
            public string? Room { get; set; }
            public string Session { get; set; } = string.Empty;
            public string StudentCode { get; set; } = string.Empty;
            public string StudentName { get; set; } = string.Empty;
            public string TopicTitle { get; set; } = string.Empty;
            public decimal? Score { get; set; }
            public string? Grade { get; set; }
        }

        private readonly ApplicationDbContext _db;

        public DefensePeriodQueryProcessor(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<ApiResponse<List<EligibleStudentDto>>> GetStudentsAsync(int periodId, bool eligibleOnly, CancellationToken cancellationToken = default)
        {
            var topics = await _db.Topics.AsNoTracking().OrderBy(t => t.TopicCode).ToListAsync(cancellationToken);
            var studentCodes = topics.Where(t => !string.IsNullOrWhiteSpace(t.ProposerStudentCode)).Select(t => t.ProposerStudentCode!).Distinct().ToList();
            var students = await _db.StudentProfiles.AsNoTracking().Where(s => studentCodes.Contains(s.StudentCode)).ToDictionaryAsync(x => x.StudentCode, x => x.FullName ?? x.StudentCode, cancellationToken);
            var topicTagMap = await LoadTopicTagMapAsync(topics.Select(x => x.TopicCode).ToList(), cancellationToken);

            var rows = topics.Select(t =>
            {
                var isEligible = IsEligibleTopic(t.Status);
                var valid = !string.IsNullOrWhiteSpace(t.ProposerStudentCode) && !string.IsNullOrWhiteSpace(t.SupervisorLecturerCode);
                return new EligibleStudentDto
                {
                    StudentCode = t.ProposerStudentCode ?? string.Empty,
                    StudentName = t.ProposerStudentCode != null && students.TryGetValue(t.ProposerStudentCode, out var n) ? n : (t.ProposerStudentCode ?? string.Empty),
                    TopicTitle = t.Title,
                    SupervisorCode = t.SupervisorLecturerCode,
                    Tags = topicTagMap.TryGetValue(t.TopicCode, out var tags) ? tags.ToList() : new List<string>(),
                    IsEligible = isEligible,
                    Valid = valid,
                    Error = valid ? null : "Thiếu StudentCode hoặc SupervisorCode"
                };
            }).ToList();

            if (eligibleOnly)
            {
                rows = rows.Where(x => x.IsEligible).ToList();
            }

            return ApiResponse<List<EligibleStudentDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<DefensePeriodConfigDto>> GetConfigAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var period = await _db.DefenseTerms.AsNoTracking().FirstOrDefaultAsync(x => x.DefenseTermId == periodId, cancellationToken);
            if (period == null)
            {
                return ApiResponse<DefensePeriodConfigDto>.Fail("Không tìm thấy đợt bảo vệ.", 404);
            }

            var config = await GetPeriodConfigAsync(periodId, cancellationToken);
            var dto = new DefensePeriodConfigDto
            {
                Rooms = config.Rooms,
                MorningStart = config.MorningStart,
                AfternoonStart = config.AfternoonStart,
                SoftMaxCapacity = config.SoftMaxCapacity,
                TopicsPerSessionConfig = config.CouncilConfig.TopicsPerSessionConfig,
                MembersPerCouncilConfig = config.CouncilConfig.MembersPerCouncilConfig,
                Tags = config.CouncilConfig.Tags
            };

            return ApiResponse<DefensePeriodConfigDto>.SuccessResponse(dto);
        }

        public async Task<ApiResponse<DefensePeriodStateDto>> GetStateAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var period = await _db.DefenseTerms.AsNoTracking().FirstOrDefaultAsync(x => x.DefenseTermId == periodId, cancellationToken);
            if (period == null)
            {
                return ApiResponse<DefensePeriodStateDto>.Fail("Không tìm thấy đợt bảo vệ.", 404);
            }

            var config = await GetPeriodConfigAsync(periodId, cancellationToken);
            var dto = new DefensePeriodStateDto
            {
                LecturerCapabilitiesLocked = config.LecturerCapabilitiesLocked,
                CouncilConfigConfirmed = config.CouncilConfigConfirmed,
                Finalized = config.Finalized,
                ScoresPublished = config.ScoresPublished,
                CouncilCount = config.CouncilIds.Count
            };

            return ApiResponse<DefensePeriodStateDto>.SuccessResponse(dto);
        }

        public async Task<ApiResponse<List<SyncErrorDetailDto>>> GetSyncErrorsAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var rows = await BuildSyncErrorRowsAsync(cancellationToken);
            return ApiResponse<List<SyncErrorDetailDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> ExportSyncErrorsAsync(int periodId, string format, CancellationToken cancellationToken = default)
        {
            var normalizedFormat = (format ?? "csv").Trim().ToLowerInvariant();
            if (normalizedFormat != "csv" && normalizedFormat != "xlsx")
            {
                return ApiResponse<(byte[] Content, string FileName, string ContentType)>.Fail("Định dạng không hợp lệ. Chỉ hỗ trợ csv hoặc xlsx.", 400);
            }

            var rows = await BuildSyncErrorRowsAsync(cancellationToken);
            var fileNameBase = $"sync-errors_{periodId}_{DateTime.UtcNow:yyyyMMddHHmmss}";

            if (normalizedFormat == "xlsx")
            {
                var xlsxBytes = BuildSyncErrorsXlsxContent(rows);
                return ApiResponse<(byte[] Content, string FileName, string ContentType)>.SuccessResponse((
                    xlsxBytes,
                    $"{fileNameBase}.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            }

            var sb = new StringBuilder();
            sb.AppendLine("RowNo,TopicCode,StudentCode,SupervisorCode,Field,ErrorCode,Message");
            foreach (var row in rows)
            {
                sb.AppendLine(string.Join(",",
                    EscapeCsv(row.RowNo.ToString()),
                    EscapeCsv(row.TopicCode),
                    EscapeCsv(row.StudentCode),
                    EscapeCsv(row.SupervisorCode ?? string.Empty),
                    EscapeCsv(row.Field),
                    EscapeCsv(row.ErrorCode),
                    EscapeCsv(row.Message)));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return ApiResponse<(byte[] Content, string FileName, string ContentType)>.SuccessResponse((
                bytes,
                $"{fileNameBase}.csv",
                "text/csv; charset=utf-8"));
        }

        public async Task<ApiResponse<List<LecturerCapabilityDto>>> GetLecturerCapabilitiesAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var lecturers = await _db.LecturerProfiles.AsNoTracking()
                .Select(l => new { l.LecturerCode, Name = l.FullName })
                .OrderBy(x => x.LecturerCode)
                .ToListAsync(cancellationToken);

            var tagMap = await _db.LecturerTags.AsNoTracking()
                .Join(_db.Tags.AsNoTracking(), lt => lt.TagID, tg => tg.TagID, (lt, tg) => new { lt.LecturerCode, tg.TagCode })
                .GroupBy(x => x.LecturerCode!)
                .ToDictionaryAsync(g => g.Key, g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToList(), cancellationToken);

            var busyMap = await _db.LecturerBusyTimes.AsNoTracking()
                .Join(_db.LecturerProfiles.AsNoTracking(), bt => bt.LecturerProfileId, lp => lp.LecturerProfileID, (bt, lp) => new { lp.LecturerCode, bt.Slot })
                .GroupBy(x => x.LecturerCode)
                .ToDictionaryAsync(g => g.Key, g => g.Select(v => v.Slot).Distinct(StringComparer.OrdinalIgnoreCase).ToList(), cancellationToken);

            var data = lecturers.Select(l => new LecturerCapabilityDto
            {
                LecturerCode = l.LecturerCode,
                LecturerName = l.Name ?? l.LecturerCode,
                Tags = tagMap.TryGetValue(l.LecturerCode, out var tags) ? tags : new List<string>(),
                BusySlots = busyMap.TryGetValue(l.LecturerCode, out var busy) ? busy : new List<string>(),
                Warning = !tagMap.TryGetValue(l.LecturerCode, out var lecturerTags) || lecturerTags.Count == 0
                    ? "Thiếu tag chuyên môn"
                    : null
            }).ToList();

            return ApiResponse<List<LecturerCapabilityDto>>.SuccessResponse(data);
        }

        public async Task<ApiResponse<List<LecturerBusySlotsDto>>> GetLecturerBusySlotsAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var periodExists = await _db.DefenseTerms.AsNoTracking().AnyAsync(x => x.DefenseTermId == periodId, cancellationToken);
            if (!periodExists)
            {
                return ApiResponse<List<LecturerBusySlotsDto>>.Fail("Không tìm thấy đợt bảo vệ.", 404);
            }

            var rows = await _db.LecturerProfiles.AsNoTracking()
                .GroupJoin(
                    _db.LecturerBusyTimes.AsNoTracking(),
                    lp => lp.LecturerProfileID,
                    bt => bt.LecturerProfileId,
                    (lp, busy) => new LecturerBusySlotsDto
                    {
                        LecturerCode = lp.LecturerCode,
                        BusySlots = busy.Select(x => x.Slot).Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList()
                    })
                .OrderBy(x => x.LecturerCode)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<LecturerBusySlotsDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<PagedResult<CouncilDraftDto>>> GetCouncilsAsync(int periodId, CouncilFilterDto filter, CancellationToken cancellationToken = default)
        {
            var config = await GetPeriodConfigAsync(periodId, cancellationToken);
            var query = _db.Committees.AsNoTracking().Where(c => config.CouncilIds.Contains(c.CommitteeID));

            if (!string.IsNullOrWhiteSpace(filter.Keyword))
            {
                var keyword = filter.Keyword.Trim();
                query = query.Where(c => (c.CommitteeCode != null && c.CommitteeCode.Contains(keyword)) || (c.Name != null && c.Name.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Room))
            {
                var room = filter.Room.Trim();
                query = query.Where(c => c.Room == room);
            }

            if (!string.IsNullOrWhiteSpace(filter.Tag))
            {
                var tag = filter.Tag.Trim();
                var committeeIds = await _db.CommitteeTags.AsNoTracking().Where(ct => ct.TagCode == tag).Select(ct => ct.CommitteeID).ToListAsync(cancellationToken);
                query = query.Where(c => committeeIds.Contains(c.CommitteeID));
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var committees = await query.OrderBy(c => c.CommitteeCode)
                .Skip((Math.Max(filter.Page, 1) - 1) * Math.Max(filter.Size, 1))
                .Take(Math.Max(filter.Size, 1))
                .ToListAsync(cancellationToken);

            var items = new List<CouncilDraftDto>();
            foreach (var committee in committees)
            {
                var detail = await BuildCouncilDtoAsync(periodId, committee.CommitteeID, cancellationToken);
                items.Add(detail);
            }

            return ApiResponse<PagedResult<CouncilDraftDto>>.SuccessResponse(new PagedResult<CouncilDraftDto>
            {
                Items = items,
                TotalCount = totalCount
            });
        }

        public async Task<ApiResponse<CouncilDraftDto>> GetCouncilDetailAsync(int periodId, int councilId, CancellationToken cancellationToken = default)
        {
            var config = await GetPeriodConfigAsync(periodId, cancellationToken);
            if (!config.CouncilIds.Contains(councilId))
            {
                return ApiResponse<CouncilDraftDto>.Fail("Hội đồng không thuộc đợt bảo vệ.", 404);
            }

            var detail = await BuildCouncilDtoAsync(periodId, councilId, cancellationToken);
            return ApiResponse<CouncilDraftDto>.SuccessResponse(detail);
        }

        public async Task<ApiResponse<object>> GetLecturerCommitteesAsync(string lecturerCode, int? periodId = null, CancellationToken cancellationToken = default)
        {
            HashSet<int>? scopedCouncilIds = null;
            if (periodId.HasValue)
            {
                var config = await GetPeriodConfigAsync(periodId.Value, cancellationToken);
                scopedCouncilIds = config.CouncilIds.ToHashSet();
            }

            var query = _db.CommitteeMembers.AsNoTracking()
                .Where(m => m.MemberLecturerCode == lecturerCode)
                .Join(_db.Committees.AsNoTracking(), m => m.CommitteeID, c => c.CommitteeID, (m, c) => new
                {
                    c.CommitteeID,
                    c.CommitteeCode,
                    c.Name,
                    c.Room,
                    c.DefenseDate,
                    Role = m.Role
                })
                .AsQueryable();

            if (scopedCouncilIds != null)
            {
                query = query.Where(x => scopedCouncilIds.Contains(x.CommitteeID));
            }

            var committees = await query.OrderBy(x => x.DefenseDate).ToListAsync(cancellationToken);

            return ApiResponse<object>.SuccessResponse(new { LecturerCode = lecturerCode, Committees = committees });
        }

        public async Task<ApiResponse<List<LecturerCommitteeMinuteDto>>> GetLecturerMinutesAsync(int committeeId, int? periodId = null, CancellationToken cancellationToken = default)
        {
            if (periodId.HasValue)
            {
                var config = await GetPeriodConfigAsync(periodId.Value, cancellationToken);
                if (!config.CouncilIds.Contains(committeeId))
                {
                    return ApiResponse<List<LecturerCommitteeMinuteDto>>.Fail("Hội đồng không thuộc đợt bảo vệ.", 404);
                }
            }

            var rows = await _db.DefenseAssignments.AsNoTracking()
                .Where(x => x.CommitteeID == committeeId)
                .Join(_db.Topics.AsNoTracking(), a => a.TopicCode, t => t.TopicCode, (a, t) => new { a, t })
                .GroupJoin(_db.DefenseMinutes.AsNoTracking(), at => at.a.AssignmentID, m => m.AssignmentId, (at, m) => new { at, minute = m.FirstOrDefault() })
                .OrderBy(x => x.at.a.Session)
                .Select(x => new LecturerCommitteeMinuteDto
                {
                    AssignmentId = x.at.a.AssignmentID,
                    TopicCode = x.at.t.TopicCode,
                    TopicTitle = x.at.t.Title,
                    SummaryContent = x.minute != null ? x.minute.SummaryContent : null,
                    QnaDetails = x.minute != null ? x.minute.QnaDetails : null,
                    LastUpdated = x.minute != null ? x.minute.LastUpdated : null
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<List<LecturerCommitteeMinuteDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<List<object>>> GetLecturerRevisionQueueAsync(string lecturerCode, int? periodId = null, CancellationToken cancellationToken = default)
        {
            HashSet<int>? scopedCouncilIds = null;
            if (periodId.HasValue)
            {
                var config = await GetPeriodConfigAsync(periodId.Value, cancellationToken);
                scopedCouncilIds = config.CouncilIds.ToHashSet();
            }

            var committeeQueue = await _db.CommitteeMembers.AsNoTracking()
                .Where(cm => cm.MemberLecturerCode == lecturerCode)
                .Join(_db.DefenseAssignments.AsNoTracking(), cm => cm.CommitteeID, da => da.CommitteeID, (cm, da) => da)
                .Where(da => scopedCouncilIds == null || (da.CommitteeID.HasValue && scopedCouncilIds.Contains(da.CommitteeID.Value)))
                .Join(_db.DefenseRevisions.AsNoTracking(), da => da.AssignmentID, rv => rv.AssignmentId, (da, rv) => new { da, rv })
                .Join(_db.Topics.AsNoTracking(), x => x.da.TopicCode, t => t.TopicCode, (x, t) => new
                {
                    x.rv.Id,
                    x.rv.AssignmentId,
                    x.rv.FinalStatus,
                    x.rv.RevisionFileUrl,
                    x.rv.LastUpdated,
                    t.TopicCode,
                    t.Title,
                    t.ProposerStudentCode
                })
                .Where(x => x.FinalStatus == RevisionFinalStatus.Pending)
                .OrderByDescending(x => x.LastUpdated)
                .ToListAsync(cancellationToken);

            var supervisorQueue = await _db.Topics.AsNoTracking()
                .Where(t => t.SupervisorLecturerCode == lecturerCode)
                .Join(_db.DefenseAssignments.AsNoTracking(), t => t.TopicCode, da => da.TopicCode, (t, da) => new { t, da })
                .Where(td => scopedCouncilIds == null || (td.da.CommitteeID.HasValue && scopedCouncilIds.Contains(td.da.CommitteeID.Value)))
                .Join(_db.DefenseRevisions.AsNoTracking(), td => td.da.AssignmentID, rv => rv.AssignmentId, (td, rv) => new
                {
                    rv.Id,
                    rv.AssignmentId,
                    rv.FinalStatus,
                    rv.RevisionFileUrl,
                    rv.LastUpdated,
                    td.t.TopicCode,
                    td.t.Title,
                    td.t.ProposerStudentCode
                })
                .Where(x => x.FinalStatus == RevisionFinalStatus.Pending)
                .OrderByDescending(x => x.LastUpdated)
                .ToListAsync(cancellationToken);

            var queue = committeeQueue
                .Concat(supervisorQueue)
                .GroupBy(x => x.Id)
                .Select(g => g.First())
                .OrderByDescending(x => x.LastUpdated)
                .Cast<object>()
                .ToList();

            return ApiResponse<List<object>>.SuccessResponse(queue);
        }

        public async Task<ApiResponse<StudentDefenseInfoDtoV2>> GetStudentDefenseInfoAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default)
        {
            HashSet<int>? scopedCouncilIds = null;
            if (periodId.HasValue)
            {
                var config = await GetPeriodConfigAsync(periodId.Value, cancellationToken);
                scopedCouncilIds = config.CouncilIds.ToHashSet();
            }

            var projection = await _db.Topics.AsNoTracking()
                .Where(t => t.ProposerStudentCode == studentCode)
                .Join(_db.DefenseAssignments.AsNoTracking(), t => t.TopicCode, a => a.TopicCode, (t, a) => new { t, a })
                .Where(x => scopedCouncilIds == null || (x.a.CommitteeID.HasValue && scopedCouncilIds.Contains(x.a.CommitteeID.Value)))
                .Join(_db.Committees.AsNoTracking(), ta => ta.a.CommitteeID, c => c.CommitteeID, (ta, c) => new { ta.t, ta.a, c })
                .GroupJoin(_db.DefenseResults.AsNoTracking(), x => x.a.AssignmentID, r => r.AssignmentId, (x, r) => new { x, result = r.FirstOrDefault() })
                .Select(x => new StudentDefenseInfoDtoV2
                {
                    StudentCode = studentCode,
                    StudentName = _db.StudentProfiles.Where(s => s.StudentCode == studentCode).Select(s => s.FullName).FirstOrDefault() ?? studentCode,
                    TopicCode = x.x.t.TopicCode,
                    TopicTitle = x.x.t.Title,
                    CommitteeCode = x.x.c.CommitteeCode,
                    Room = x.x.c.Room,
                    ScheduledAt = x.x.a.ScheduledAt,
                    Session = x.x.a.Session,
                    SessionCode = ToSessionCode(x.x.a.Session),
                    FinalScore = x.result != null ? x.result.FinalScoreNumeric : null,
                    Grade = x.result != null ? x.result.FinalScoreText : null
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (projection == null)
            {
                return ApiResponse<StudentDefenseInfoDtoV2>.Fail("Chưa có thông tin bảo vệ.", 404);
            }

            return ApiResponse<StudentDefenseInfoDtoV2>.SuccessResponse(projection);
        }

        public async Task<ApiResponse<List<StudentNotificationDto>>> GetStudentNotificationsAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default)
        {
            var query = _db.SyncAuditLogs.AsNoTracking()
                .Where(x => x.Action.Contains("PUBLISH") || x.Action.Contains("FINALIZE") || x.Action.Contains("SYNC"))
                .AsQueryable();

            if (periodId.HasValue)
            {
                var periodToken = $"period={periodId.Value}";
                query = query.Where(x => x.Records.Contains(periodToken));
            }

            var notices = await query.OrderByDescending(x => x.Timestamp)
                .Take(30)
                .Select(x => new StudentNotificationDto
                {
                    Type = x.Action,
                    Message = x.Records,
                    Timestamp = x.Timestamp
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<List<StudentNotificationDto>>.SuccessResponse(notices);
        }

        public async Task<ApiResponse<List<object>>> GetStudentRevisionHistoryAsync(string studentCode, int? periodId = null, CancellationToken cancellationToken = default)
        {
            HashSet<int>? scopedCouncilIds = null;
            if (periodId.HasValue)
            {
                var config = await GetPeriodConfigAsync(periodId.Value, cancellationToken);
                scopedCouncilIds = config.CouncilIds.ToHashSet();
            }

            var history = await _db.Topics.AsNoTracking()
                .Where(t => t.ProposerStudentCode == studentCode)
                .Join(_db.DefenseAssignments.AsNoTracking(), t => t.TopicCode, a => a.TopicCode, (t, a) => a)
                .Where(a => scopedCouncilIds == null || (a.CommitteeID.HasValue && scopedCouncilIds.Contains(a.CommitteeID.Value)))
                .Join(_db.DefenseRevisions.AsNoTracking(), a => a.AssignmentID, r => r.AssignmentId, (a, r) => new
                {
                    r.Id,
                    r.AssignmentId,
                    r.RevisionFileUrl,
                    r.FinalStatus,
                    r.IsCtApproved,
                    r.IsUvtkApproved,
                    r.IsGvhdApproved,
                    r.CreatedAt,
                    r.LastUpdated
                })
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<object>>.SuccessResponse(history.Cast<object>().ToList());
        }

        public async Task<ApiResponse<AnalyticsOverviewDto>> GetOverviewAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var scoreRows = await GetScoreRowsAsync(periodId, cancellationToken);
            var numeric = scoreRows.Where(x => x.Score.HasValue).Select(x => x.Score!.Value).ToList();
            var total = scoreRows.Count;
            var highestRow = scoreRows.Where(x => x.Score.HasValue).OrderByDescending(x => x.Score).ThenBy(x => x.StudentCode).FirstOrDefault();
            var lowestRow = scoreRows.Where(x => x.Score.HasValue).OrderBy(x => x.Score).ThenBy(x => x.StudentCode).FirstOrDefault();

            var dto = new AnalyticsOverviewDto
            {
                TotalStudents = total,
                Average = numeric.Count == 0 ? 0 : Math.Round(numeric.Average(), 2),
                PassRate = total == 0 ? 0 : Math.Round((decimal)numeric.Count(x => x >= 4) * 100 / total, 2),
                Highest = numeric.Count == 0 ? 0 : numeric.Max(),
                Lowest = numeric.Count == 0 ? 0 : numeric.Min(),
                HighestStudentCode = highestRow?.StudentCode,
                HighestStudentName = highestRow?.StudentName,
                HighestTopicTitle = highestRow?.TopicTitle,
                LowestStudentCode = lowestRow?.StudentCode,
                LowestStudentName = lowestRow?.StudentName,
                LowestTopicTitle = lowestRow?.TopicTitle
            };

            return ApiResponse<AnalyticsOverviewDto>.SuccessResponse(dto);
        }

        public async Task<ApiResponse<List<CouncilAnalyticsDto>>> GetAnalyticsByCouncilAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var scoreRows = await GetScoreRowsAsync(periodId, cancellationToken);
            var grouped = scoreRows.GroupBy(x => new { x.CouncilId, x.Room }).Select(g =>
            {
                var values = g.Where(r => r.Score.HasValue).Select(r => r.Score!.Value).ToList();
                return new CouncilAnalyticsDto
                {
                    CouncilId = g.Key.CouncilId,
                    CouncilCode = g.First().CouncilId.ToString(),
                    Room = g.Key.Room,
                    Count = g.Count(),
                    Avg = values.Count == 0 ? 0 : Math.Round(values.Average(), 2),
                    Max = values.Count == 0 ? 0 : values.Max(),
                    Min = values.Count == 0 ? 0 : values.Min()
                };
            }).OrderBy(x => x.CouncilId).ToList();

            return ApiResponse<List<CouncilAnalyticsDto>>.SuccessResponse(grouped);
        }

        public async Task<ApiResponse<AnalyticsDistributionDto>> GetDistributionAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var rows = await GetScoreRowsAsync(periodId, cancellationToken);
            var vals = rows.Where(x => x.Score.HasValue).Select(x => x.Score!.Value).ToList();

            var distribution = new AnalyticsDistributionDto
            {
                Excellent = vals.Count(x => x >= 9),
                Good = vals.Count(x => x >= 7 && x < 9),
                Fair = vals.Count(x => x >= 5.5m && x < 7),
                Weak = vals.Count(x => x < 5.5m)
            };

            return ApiResponse<AnalyticsDistributionDto>.SuccessResponse(distribution);
        }

        public async Task<ApiResponse<(byte[] Content, string FileName, string ContentType)>> BuildReportAsync(int periodId, string reportType, string format, int? councilId, CancellationToken cancellationToken = default)
        {
            var rows = await GetScoreRowsAsync(periodId, cancellationToken);
            if (councilId.HasValue)
            {
                rows = rows.Where(r => r.CouncilId == councilId.Value).ToList();
            }

            var normalizedFormat = (format ?? "csv").Trim().ToLowerInvariant();
            var safeType = string.IsNullOrWhiteSpace(reportType) ? "report" : reportType.Trim().ToLowerInvariant();
            var fileNameBase = councilId.HasValue ? $"{safeType}_{periodId}_c{councilId.Value}" : $"{safeType}_{periodId}";

            if (normalizedFormat == "pdf")
            {
                var pdfBytes = BuildPdfContent(rows, reportType, councilId);
                await TrackExportAsync(periodId, $"{fileNameBase}.pdf", "Success", cancellationToken);
                return ApiResponse<(byte[] Content, string FileName, string ContentType)>.SuccessResponse((
                    pdfBytes,
                    $"{fileNameBase}.pdf",
                    "application/pdf"));
            }

            if (normalizedFormat == "xlsx")
            {
                var xlsxBytes = BuildXlsxContent(rows, reportType, councilId);
                await TrackExportAsync(periodId, $"{fileNameBase}.xlsx", "Success", cancellationToken);
                return ApiResponse<(byte[] Content, string FileName, string ContentType)>.SuccessResponse((
                    xlsxBytes,
                    $"{fileNameBase}.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            }

            if (normalizedFormat != "csv")
            {
                return ApiResponse<(byte[] Content, string FileName, string ContentType)>.Fail(
                    "Định dạng không hợp lệ. Chỉ hỗ trợ csv, xlsx hoặc pdf.",
                    400);
            }

            var csvBytes = BuildCsvContent(rows, reportType, councilId);
            await TrackExportAsync(periodId, $"{fileNameBase}.csv", "Success", cancellationToken);
            return ApiResponse<(byte[] Content, string FileName, string ContentType)>.SuccessResponse((
                csvBytes,
                $"{fileNameBase}.csv",
                "text/csv; charset=utf-8"));
        }

        public async Task<ApiResponse<List<ExportHistoryDto>>> GetExportHistoryAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var rows = await _db.ExportFiles.AsNoTracking()
                .Where(x => x.TermId == periodId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(200)
                .Select(x => new ExportHistoryDto
                {
                    ExportFileId = x.ExportFileId,
                    FileCode = x.FileCode,
                    TermId = x.TermId,
                    Status = x.Status,
                    FileUrl = x.FileUrl,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<List<ExportHistoryDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<List<PublishHistoryDto>>> GetPublishHistoryAsync(int periodId, CancellationToken cancellationToken = default)
        {
            var periodToken = $"period={periodId}";
            var rows = await _db.SyncAuditLogs.AsNoTracking()
                .Where(x => x.Action.Contains("PUBLISH") && x.Records.Contains(periodToken))
                .OrderByDescending(x => x.Timestamp)
                .Take(200)
                .Select(x => new PublishHistoryDto
                {
                    SyncAuditLogId = x.SyncAuditLogId,
                    Action = x.Action,
                    Result = x.Result,
                    Records = x.Records,
                    Timestamp = x.Timestamp
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<List<PublishHistoryDto>>.SuccessResponse(rows);
        }

        public async Task<ApiResponse<List<CouncilAuditHistoryDto>>> GetCouncilAuditHistoryAsync(int periodId, int? councilId, CancellationToken cancellationToken = default)
        {
            var actionSet = new[]
            {
                "CREATE_COUNCIL",
                "UPDATE_COUNCIL",
                "DELETE_COUNCIL",
                "GENERATE_COUNCILS",
                "FINALIZE"
            };

            var periodToken = $"period={periodId}";
            var query = _db.SyncAuditLogs.AsNoTracking()
                .Where(x => actionSet.Contains(x.Action) && x.Records.Contains(periodToken));

            if (councilId.HasValue)
            {
                var councilToken = $"council={councilId.Value}";
                query = query.Where(x => x.Records.Contains(councilToken));
            }

            var rows = await query
                .OrderByDescending(x => x.Timestamp)
                .Take(300)
                .Select(x => new CouncilAuditHistoryDto
                {
                    SyncAuditLogId = x.SyncAuditLogId,
                    Action = x.Action,
                    Result = x.Result,
                    Records = x.Records,
                    Timestamp = x.Timestamp
                })
                .ToListAsync(cancellationToken);

            return ApiResponse<List<CouncilAuditHistoryDto>>.SuccessResponse(rows);
        }

        private async Task<List<ScoreRowData>> GetScoreRowsAsync(int periodId, CancellationToken cancellationToken)
        {
            var config = await GetPeriodConfigAsync(periodId, cancellationToken);
            if (config.CouncilIds.Count == 0)
            {
                return new List<ScoreRowData>();
            }

            return await _db.DefenseAssignments.AsNoTracking()
                .Where(a => a.CommitteeID.HasValue && config.CouncilIds.Contains(a.CommitteeID.Value))
                .Join(_db.Topics.AsNoTracking(), a => a.TopicCode, t => t.TopicCode, (a, t) => new { a, t })
                .Join(_db.Committees.AsNoTracking(), at => at.a.CommitteeID, c => c.CommitteeID, (at, c) => new { at.a, at.t, c })
                .GroupJoin(_db.DefenseResults.AsNoTracking(), x => x.a.AssignmentID, r => r.AssignmentId, (x, r) => new { x, result = r.FirstOrDefault() })
                .Select(x => new ScoreRowData
                {
                    CouncilId = x.x.c.CommitteeID,
                    Room = x.x.c.Room,
                    Session = ToSessionCode(x.x.a.Session),
                    StudentCode = x.x.t.ProposerStudentCode ?? string.Empty,
                    StudentName = _db.StudentProfiles.Where(s => s.StudentCode == x.x.t.ProposerStudentCode).Select(s => s.FullName).FirstOrDefault() ?? (x.x.t.ProposerStudentCode ?? string.Empty),
                    TopicTitle = x.x.t.Title,
                    Score = x.result != null ? x.result.FinalScoreNumeric : null,
                    Grade = x.result != null ? x.result.FinalScoreText : null
                })
                .ToListAsync(cancellationToken);
        }

        private static byte[] BuildCsvContent(List<ScoreRowData> rows, string reportType, int? councilId)
        {
            var normalizedType = (reportType ?? string.Empty).Trim().ToLowerInvariant();
            var sb = new StringBuilder();

            if (normalizedType == "council-summary")
            {
                sb.AppendLine("CouncilId,Room,StudentCount,Avg,Max,Min");
                foreach (var row in BuildCouncilSummary(rows))
                {
                    sb.AppendLine(string.Join(",",
                        EscapeCsv(row.CouncilId.ToString()),
                        EscapeCsv(row.Room),
                        EscapeCsv(row.StudentCount.ToString()),
                        EscapeCsv(row.Avg.ToString("0.0")),
                        EscapeCsv(row.Max.ToString("0.0")),
                        EscapeCsv(row.Min.ToString("0.0"))));
                }
            }
            else
            {
                sb.AppendLine("CouncilId,Room,Session,StudentCode,StudentName,TopicTitle,Score,Grade");
                foreach (var row in rows.OrderBy(r => r.CouncilId).ThenBy(r => r.Session).ThenBy(r => r.StudentCode))
                {
                    sb.AppendLine(string.Join(",",
                        EscapeCsv(row.CouncilId.ToString()),
                        EscapeCsv(row.Room ?? string.Empty),
                        EscapeCsv(row.Session),
                        EscapeCsv(row.StudentCode),
                        EscapeCsv(row.StudentName),
                        EscapeCsv(row.TopicTitle),
                        EscapeCsv(row.Score?.ToString("0.0") ?? string.Empty),
                        EscapeCsv(row.Grade ?? string.Empty)));
                }

                if (normalizedType == "final-term")
                {
                    var numeric = rows.Where(r => r.Score.HasValue).Select(r => r.Score!.Value).ToList();
                    if (numeric.Count > 0)
                    {
                        sb.AppendLine();
                        sb.AppendLine($"Highest,{numeric.Max():0.0}");
                        sb.AppendLine($"Lowest,{numeric.Min():0.0}");
                    }
                }

                if (normalizedType == "form-1" && councilId.HasValue)
                {
                    sb.AppendLine();
                    sb.AppendLine($"Council,{EscapeCsv(councilId.Value.ToString())}");
                }
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static byte[] BuildXlsxContent(List<ScoreRowData> rows, string reportType, int? councilId)
        {
            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("Report");
            var normalizedType = (reportType ?? string.Empty).Trim().ToLowerInvariant();

            if (normalizedType == "council-summary")
            {
                sheet.Cell(1, 1).Value = "CouncilId";
                sheet.Cell(1, 2).Value = "Room";
                sheet.Cell(1, 3).Value = "StudentCount";
                sheet.Cell(1, 4).Value = "Avg";
                sheet.Cell(1, 5).Value = "Max";
                sheet.Cell(1, 6).Value = "Min";

                var summaries = BuildCouncilSummary(rows);
                for (var i = 0; i < summaries.Count; i++)
                {
                    var row = summaries[i];
                    var r = i + 2;
                    sheet.Cell(r, 1).Value = row.CouncilId;
                    sheet.Cell(r, 2).Value = row.Room;
                    sheet.Cell(r, 3).Value = row.StudentCount;
                    sheet.Cell(r, 4).Value = row.Avg;
                    sheet.Cell(r, 5).Value = row.Max;
                    sheet.Cell(r, 6).Value = row.Min;
                }
            }
            else
            {
                sheet.Cell(1, 1).Value = "CouncilId";
                sheet.Cell(1, 2).Value = "Room";
                sheet.Cell(1, 3).Value = "Session";
                sheet.Cell(1, 4).Value = "StudentCode";
                sheet.Cell(1, 5).Value = "StudentName";
                sheet.Cell(1, 6).Value = "TopicTitle";
                sheet.Cell(1, 7).Value = "Score";
                sheet.Cell(1, 8).Value = "Grade";

                var ordered = rows.OrderBy(r => r.CouncilId).ThenBy(r => r.Session).ThenBy(r => r.StudentCode).ToList();
                for (var i = 0; i < ordered.Count; i++)
                {
                    var row = ordered[i];
                    var r = i + 2;
                    sheet.Cell(r, 1).Value = row.CouncilId;
                    sheet.Cell(r, 2).Value = row.Room ?? string.Empty;
                    sheet.Cell(r, 3).Value = row.Session;
                    sheet.Cell(r, 4).Value = row.StudentCode;
                    sheet.Cell(r, 5).Value = row.StudentName;
                    sheet.Cell(r, 6).Value = row.TopicTitle;
                    sheet.Cell(r, 7).Value = row.Score.HasValue ? row.Score.Value : string.Empty;
                    sheet.Cell(r, 8).Value = row.Grade ?? string.Empty;
                }

                var nextRow = ordered.Count + 3;
                if (normalizedType == "final-term")
                {
                    var numeric = rows.Where(r => r.Score.HasValue).Select(r => r.Score!.Value).ToList();
                    if (numeric.Count > 0)
                    {
                        sheet.Cell(nextRow, 1).Value = "Highest";
                        sheet.Cell(nextRow, 2).Value = numeric.Max();
                        sheet.Cell(nextRow + 1, 1).Value = "Lowest";
                        sheet.Cell(nextRow + 1, 2).Value = numeric.Min();
                        nextRow += 2;
                    }
                }

                if (normalizedType == "form-1" && councilId.HasValue)
                {
                    sheet.Cell(nextRow, 1).Value = "Council";
                    sheet.Cell(nextRow, 2).Value = councilId.Value;
                }
            }

            sheet.RangeUsed()?.Style.Font.SetBold(false);
            sheet.Row(1).Style.Font.SetBold(true);
            sheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private static byte[] BuildPdfContent(List<ScoreRowData> rows, string reportType, int? councilId)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var normalizedType = (reportType ?? string.Empty).Trim().ToLowerInvariant();

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(24);
                    page.Size(PageSizes.A4.Landscape());
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("Defense Report").Bold().FontSize(16);
                        col.Item().Text($"Type: {reportType}");
                        col.Item().Text($"Council: {(councilId.HasValue ? councilId.Value.ToString() : "ALL")}");
                        col.Item().Text($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm}");
                    });

                    if (normalizedType == "council-summary")
                    {
                        var summaries = BuildCouncilSummary(rows);
                        page.Content().PaddingTop(12).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(70);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Council").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Room").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Students").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Avg").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Max").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Min").Bold();
                            });

                            foreach (var summary in summaries)
                            {
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.CouncilId.ToString());
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.Room);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.StudentCount.ToString());
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.Avg.ToString("0.0"));
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.Max.ToString("0.0"));
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(summary.Min.ToString("0.0"));
                            }
                        });
                    }
                    else
                    {
                        page.Content().PaddingTop(12).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(60);
                                columns.ConstantColumn(70);
                                columns.ConstantColumn(55);
                                columns.ConstantColumn(80);
                                columns.RelativeColumn(1.2f);
                                columns.RelativeColumn(1.8f);
                                columns.ConstantColumn(55);
                                columns.ConstantColumn(45);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Council").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Room").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Session").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Student").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Name").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Topic").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Score").Bold();
                                header.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(3).Text("Grade").Bold();
                            });

                            foreach (var row in rows)
                            {
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.CouncilId.ToString());
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.Room ?? string.Empty);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.Session);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.StudentCode);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.StudentName);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.TopicTitle);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.Score?.ToString("0.0") ?? string.Empty);
                                table.Cell().Border(0.6f).BorderColor(Colors.Grey.Lighten1).PaddingVertical(3).PaddingHorizontal(3).Text(row.Grade ?? string.Empty);
                            }
                        });
                    }

                    var numeric = rows.Where(r => r.Score.HasValue).Select(r => r.Score!.Value).ToList();
                    if (numeric.Count > 0)
                    {
                        page.Footer().AlignRight().Text($"Highest: {numeric.Max():0.0} | Lowest: {numeric.Min():0.0}").SemiBold();
                    }
                });
            }).GeneratePdf();
        }

        private static List<CouncilSummaryRow> BuildCouncilSummary(List<ScoreRowData> rows)
        {
            return rows
                .GroupBy(r => new { r.CouncilId, Room = r.Room ?? string.Empty })
                .Select(g =>
                {
                    var vals = g.Where(x => x.Score.HasValue).Select(x => x.Score!.Value).ToList();
                    return new CouncilSummaryRow
                    {
                        CouncilId = g.Key.CouncilId,
                        Room = g.Key.Room,
                        StudentCount = g.Count(),
                        Avg = vals.Count == 0 ? 0 : Math.Round(vals.Average(), 1),
                        Max = vals.Count == 0 ? 0 : vals.Max(),
                        Min = vals.Count == 0 ? 0 : vals.Min()
                    };
                })
                .OrderBy(x => x.CouncilId)
                .ToList();
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }

            return value;
        }

        private static byte[] BuildSyncErrorsXlsxContent(List<SyncErrorDetailDto> rows)
        {
            using var workbook = new XLWorkbook();
            var sheet = workbook.Worksheets.Add("SyncErrors");

            sheet.Cell(1, 1).Value = "RowNo";
            sheet.Cell(1, 2).Value = "TopicCode";
            sheet.Cell(1, 3).Value = "StudentCode";
            sheet.Cell(1, 4).Value = "SupervisorCode";
            sheet.Cell(1, 5).Value = "Field";
            sheet.Cell(1, 6).Value = "ErrorCode";
            sheet.Cell(1, 7).Value = "Message";

            for (var i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                var r = i + 2;
                sheet.Cell(r, 1).Value = row.RowNo;
                sheet.Cell(r, 2).Value = row.TopicCode;
                sheet.Cell(r, 3).Value = row.StudentCode;
                sheet.Cell(r, 4).Value = row.SupervisorCode ?? string.Empty;
                sheet.Cell(r, 5).Value = row.Field;
                sheet.Cell(r, 6).Value = row.ErrorCode;
                sheet.Cell(r, 7).Value = row.Message;
            }

            sheet.Row(1).Style.Font.SetBold(true);
            sheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private async Task<List<SyncErrorDetailDto>> BuildSyncErrorRowsAsync(CancellationToken cancellationToken)
        {
            var topics = await _db.Topics.AsNoTracking().OrderBy(t => t.TopicCode).ToListAsync(cancellationToken);
            var rows = new List<SyncErrorDetailDto>();

            for (var i = 0; i < topics.Count; i++)
            {
                var topic = topics[i];
                var rowNo = i + 1;
                var studentCode = topic.ProposerStudentCode ?? string.Empty;
                var supervisorCode = topic.SupervisorLecturerCode;

                if (string.IsNullOrWhiteSpace(studentCode))
                {
                    rows.Add(new SyncErrorDetailDto
                    {
                        RowNo = rowNo,
                        TopicCode = topic.TopicCode,
                        StudentCode = studentCode,
                        SupervisorCode = supervisorCode,
                        Field = "StudentCode",
                        ErrorCode = "UC1.1.MISSING_STUDENT_CODE",
                        Message = "Thiếu StudentCode"
                    });
                }

                if (string.IsNullOrWhiteSpace(supervisorCode))
                {
                    rows.Add(new SyncErrorDetailDto
                    {
                        RowNo = rowNo,
                        TopicCode = topic.TopicCode,
                        StudentCode = studentCode,
                        SupervisorCode = supervisorCode,
                        Field = "SupervisorCode",
                        ErrorCode = "UC1.1.MISSING_SUPERVISOR_CODE",
                        Message = "Thiếu SupervisorCode"
                    });
                }

                if (!IsEligibleTopic(topic.Status))
                {
                    rows.Add(new SyncErrorDetailDto
                    {
                        RowNo = rowNo,
                        TopicCode = topic.TopicCode,
                        StudentCode = studentCode,
                        SupervisorCode = supervisorCode,
                        Field = "Status",
                        ErrorCode = "UC1.1.INVALID_TOPIC_STATUS",
                        Message = $"Trạng thái không hợp lệ: {topic.Status ?? "NULL"}"
                    });
                }
            }

            return rows;
        }

        private async Task TrackExportAsync(int periodId, string fileName, string status, CancellationToken cancellationToken)
        {
            var code = $"EXP{DateTime.UtcNow:yyyyMMddHHmmssfff}";
            var existing = await _db.ExportFiles.AsNoTracking().AnyAsync(x => x.FileCode == code, cancellationToken);
            if (existing)
            {
                code = $"EXP{DateTime.UtcNow:yyyyMMddHHmmssfff}{Random.Shared.Next(10, 99)}";
            }

            _db.ExportFiles.Add(new ExportFile
            {
                FileCode = code,
                TermId = periodId,
                Status = status,
                FileUrl = fileName,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync(cancellationToken);
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
                .ToDictionaryAsync(g => g.Key, g => g.Select(v => v.TagCode).Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase), cancellationToken);
        }

        private async Task<DefensePeriodConfigSnapshot> GetPeriodConfigAsync(int periodId, CancellationToken cancellationToken)
        {
            var period = await _db.DefenseTerms.AsNoTracking().FirstOrDefaultAsync(x => x.DefenseTermId == periodId, cancellationToken);
            if (period == null || string.IsNullOrWhiteSpace(period.ConfigJson))
            {
                return new DefensePeriodConfigSnapshot();
            }

            try
            {
                return JsonSerializer.Deserialize<DefensePeriodConfigSnapshot>(period.ConfigJson) ?? new DefensePeriodConfigSnapshot();
            }
            catch
            {
                return new DefensePeriodConfigSnapshot();
            }
        }

        private static bool IsEligibleTopic(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return false;
            return string.Equals(status, "Đủ điều kiện bảo vệ", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "Eligible", StringComparison.OrdinalIgnoreCase)
                || string.Equals(status, "ELIGIBLE", StringComparison.OrdinalIgnoreCase);
        }

            private static string ToSessionCode(int? session)
            {
                return session == 1 ? DefenseSessionCodes.Morning : DefenseSessionCodes.Afternoon;
            }

        private async Task<CouncilDraftDto> BuildCouncilDtoAsync(int periodId, int councilId, CancellationToken cancellationToken)
        {
            var committee = await _db.Committees.AsNoTracking().FirstAsync(x => x.CommitteeID == councilId, cancellationToken);
            var assignments = await _db.DefenseAssignments.AsNoTracking().Where(x => x.CommitteeID == councilId).OrderBy(x => x.Session).ThenBy(x => x.StartTime).ToListAsync(cancellationToken);
            var topicCodes = assignments.Where(x => !string.IsNullOrWhiteSpace(x.TopicCode)).Select(x => x.TopicCode!).ToList();
            var topics = await _db.Topics.AsNoTracking().Where(x => topicCodes.Contains(x.TopicCode)).ToListAsync(cancellationToken);
            var tags = await _db.CommitteeTags.AsNoTracking().Where(x => x.CommitteeID == councilId).Select(x => x.TagCode).ToListAsync(cancellationToken);
            var members = await _db.CommitteeMembers.AsNoTracking().Where(x => x.CommitteeID == councilId).ToListAsync(cancellationToken);
            var students = await _db.StudentProfiles.AsNoTracking().ToDictionaryAsync(x => x.StudentCode, x => x.FullName ?? x.StudentCode, cancellationToken);
            var lecturerNameMap = await _db.LecturerProfiles.AsNoTracking()
                .Select(l => new { l.LecturerCode, Name = l.FullName ?? l.LecturerCode })
                .ToDictionaryAsync(x => x.LecturerCode, x => x.Name, cancellationToken);

            var dto = new CouncilDraftDto
            {
                Id = committee.CommitteeID,
                ConcurrencyToken = committee.LastUpdated.Ticks.ToString(CultureInfo.InvariantCulture),
                Room = committee.Room ?? string.Empty,
                SlotId = $"{committee.DefenseDate:yyyyMMdd}",
                CouncilTags = tags,
                Status = committee.Status ?? "Draft",
                ForbiddenLecturers = topics.Select(t => t.SupervisorLecturerCode).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                Members = members.Select(m => new CouncilMemberDto
                {
                    Role = m.Role ?? string.Empty,
                    LecturerCode = m.MemberLecturerCode ?? string.Empty,
                    LecturerName = lecturerNameMap.TryGetValue(m.MemberLecturerCode ?? string.Empty, out var name) ? name : (m.MemberLecturerCode ?? string.Empty)
                }).ToList()
            };

            foreach (var assignment in assignments.Where(x => x.Session == 1))
            {
                var topic = topics.FirstOrDefault(t => t.TopicCode == assignment.TopicCode);
                if (topic == null) continue;
                dto.MorningStudents.Add(new EligibleStudentDto
                {
                    StudentCode = topic.ProposerStudentCode ?? string.Empty,
                    StudentName = topic.ProposerStudentCode != null && students.TryGetValue(topic.ProposerStudentCode, out var n) ? n : (topic.ProposerStudentCode ?? string.Empty),
                    TopicTitle = topic.Title,
                    SupervisorCode = topic.SupervisorLecturerCode,
                    IsEligible = true,
                    Valid = true
                });
            }

            foreach (var assignment in assignments.Where(x => x.Session == 2))
            {
                var topic = topics.FirstOrDefault(t => t.TopicCode == assignment.TopicCode);
                if (topic == null) continue;
                dto.AfternoonStudents.Add(new EligibleStudentDto
                {
                    StudentCode = topic.ProposerStudentCode ?? string.Empty,
                    StudentName = topic.ProposerStudentCode != null && students.TryGetValue(topic.ProposerStudentCode, out var n) ? n : (topic.ProposerStudentCode ?? string.Empty),
                    TopicTitle = topic.Title,
                    SupervisorCode = topic.SupervisorLecturerCode,
                    IsEligible = true,
                    Valid = true
                });
            }

            if (dto.MorningStudents.Count != 4 || dto.AfternoonStudents.Count != 4 || dto.Members.Count != 4)
            {
                dto.Warning = "Vi phạm chuẩn cứng: 2 buổi x 4 đề tài + 4 thành viên.";
                dto.Status = "Warning";
            }

            return dto;
        }
    }
}

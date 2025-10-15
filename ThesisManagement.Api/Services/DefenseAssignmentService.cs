#if false
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;

namespace ThesisManagement.Api.Services
{
    public interface IDefenseAssignmentService
    {
        Task<ApiResponse<List<AvailableTopicDto>>> GetAvailableTopicsAsync();
        Task<ApiResponse<bool>> AssignTopicsAsync(AssignDefenseDto dto);
        Task<ApiResponse<List<DefenseAssignmentDetailDto>>> GetCommitteeAssignmentsAsync(string committeeCode);
        Task<ApiResponse<AutoAssignResultDto>> AutoAssignTopicsAsync(AutoAssignRequestDto dto);
        Task<ApiResponse<bool>> ChangeAssignmentAsync(ChangeAssignmentDto dto);
        Task<ApiResponse<bool>> RemoveAssignmentAsync(RemoveAssignmentDto dto);
    }

    public class DefenseAssignmentService : IDefenseAssignmentService
    {
        private readonly ApplicationDbContext _context;
        private const string EligibleTopicStatus = "Đủ điều kiện bảo vệ";
    private const string AssignedTopicStatus = "Đã phân hội đồng";
        namespace ThesisManagement.Api.Services
        {
            // Legacy defense assignment service removed after module redesign.
        }

                var committeeTags = await _context.CommitteeTags
                    .Where(ct => ct.CommitteeCode == dto.CommitteeCode)
                    .Select(ct => ct.TagCode)
                    .Where(code => code != null)
                    .Select(code => code!)
                    .Distinct()
                    .ToListAsync();

                var topicCodes = dto.Topics.Select(t => t.TopicCode).Distinct().ToList();

                var topics = await _context.Topics
                    .Where(t => topicCodes.Contains(t.TopicCode))
                    .ToListAsync();

                if (topics.Count != dto.Topics.Count)
                {
                    return ApiResponse<bool>.Fail("Một hoặc nhiều đề tài không tồn tại");
                }

                var invalidTopics = topics
                    .Where(t => t.Status != EligibleTopicStatus)
                    .Select(t => t.TopicCode)
                    .ToList();

                if (invalidTopics.Any())
                {
                    return ApiResponse<bool>.Fail($"Các đề tài sau không đủ điều kiện bảo vệ: {string.Join(", ", invalidTopics)}");
                }

                var topicTagLookup = await GetTopicTagsLookupAsync(topicCodes);
                var topicDictionary = topics.ToDictionary(t => t.TopicCode, StringComparer.OrdinalIgnoreCase);

                if (committeeTags.Any())
                {
                    foreach (var topic in topics)
                    {
                        var tags = topicTagLookup.TryGetValue(topic.TopicCode, out var topicTags)
                            ? topicTags
                            : new List<string>();

                        if (!tags.Any(tag => committeeTags.Contains(tag)))
                        {
                            return ApiResponse<bool>.Fail($"Đề tài '{topic.TopicCode}' không phù hợp với thẻ chủ đề của hội đồng.");
                        }
                    }
                }

                if (topics.Any(t => !string.IsNullOrEmpty(t.SupervisorLecturerCode) &&
                    committeeLecturerCodes.Contains(t.SupervisorLecturerCode!)))
                {
                    var conflict = topics.First(t => !string.IsNullOrEmpty(t.SupervisorLecturerCode) && committeeLecturerCodes.Contains(t.SupervisorLecturerCode!));
                    return ApiResponse<bool>.Fail($"Đề tài '{conflict.TopicCode}' không thể phân cho hội đồng này vì giảng viên hướng dẫn đang là thành viên hội đồng.");
                }

                var alreadyAssigned = await _context.DefenseAssignments
                    .Where(da => da.TopicCode != null && topicCodes.Contains(da.TopicCode))
                    .Select(da => da.TopicCode!)
                    .ToListAsync();

                if (alreadyAssigned.Any())
                {
                    return ApiResponse<bool>.Fail($"Các đề tài sau đã được phân hội đồng: {string.Join(", ", alreadyAssigned)}");
                }

                if (dto.Topics.Count > MaxTopicsPerCommittee)
                {
                    return ApiResponse<bool>.Fail($"Một hội đồng chỉ có thể xếp tối đa {MaxTopicsPerCommittee} đề tài (2 buổi).");
                }

                if (committee.DefenseDate.HasValue)
                {
                    var defenseDate = committee.DefenseDate.Value.Date;
                    foreach (var topicAssignment in dto.Topics)
                    {
                        if (topicAssignment.ScheduledAt == default || !topicAssignment.Session.HasValue)
                        {
                            return ApiResponse<bool>.Fail($"Đề tài '{topicAssignment.TopicCode}' chưa có lịch bảo vệ hợp lệ.");
                        }

                        if (topicAssignment.Session is < 1 or > SessionsPerCommittee)
                        {
                            return ApiResponse<bool>.Fail($"Đề tài '{topicAssignment.TopicCode}' phải thuộc buổi 1 hoặc buổi 2.");
                        }

                        if (!topicAssignment.StartTime.HasValue || !topicAssignment.EndTime.HasValue)
                        {
                            return ApiResponse<bool>.Fail($"Đề tài '{topicAssignment.TopicCode}' chưa có giờ bắt đầu hoặc kết thúc.");
                        }

                        if (topicAssignment.EndTime <= topicAssignment.StartTime)
                        {
                            return ApiResponse<bool>.Fail($"Giờ kết thúc phải lớn hơn giờ bắt đầu cho đề tài '{topicAssignment.TopicCode}'.");
                        }

                        if (topicAssignment.ScheduledAt.Date != defenseDate)
                        {
                            return ApiResponse<bool>.Fail($"Lịch bảo vệ của đề tài '{topicAssignment.TopicCode}' phải nằm trong ngày bảo vệ của hội đồng ({defenseDate:dd/MM/yyyy})");
                        }

                        var expectedScheduled = DateTime.SpecifyKind(defenseDate.Add(topicAssignment.StartTime.Value), DateTimeKind.Utc);
                        if (topicAssignment.ScheduledAt != expectedScheduled)
                        {
                            topicAssignment.ScheduledAt = expectedScheduled;
                        }
                    }

                    var sessionGrouping = dto.Topics
                        .Where(t => t.Session.HasValue)
                        .GroupBy(t => t.Session!.Value)
                        .ToDictionary(g => g.Key, g => g.ToList());

                    foreach (var (session, items) in sessionGrouping)
                    {
                        if (items.Count > TopicsPerSession)
                        {
                            return ApiResponse<bool>.Fail($"Buổi số {session} vượt quá {TopicsPerSession} đề tài.");
                        }

                        namespace ThesisManagement.Api.Services
                        {
                            // Legacy defense assignment service removed after module redesign.
                        }
                        StartTime = topicAssignment.StartTime,
                        EndTime = topicAssignment.EndTime,
                        AssignedAt = now,
                        CreatedAt = now,
                        namespace ThesisManagement.Api.Services
                        {
                            // Legacy defense assignment service removed after module redesign.
                        }
                }

                var committeeCodes = committees.Select(c => c.CommitteeCode).ToList();

                var committeeMembers = await _context.CommitteeMembers
                    .Where(cm => cm.CommitteeCode != null && committeeCodes.Contains(cm.CommitteeCode))
                    .ToListAsync();

                var membersByCommittee = committeeMembers
                    .Where(cm => cm.CommitteeCode != null)
                    .GroupBy(cm => cm.CommitteeCode!)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var code in committeeCodes)
                {
                    if (!membersByCommittee.ContainsKey(code))
                    {
                        membersByCommittee[code] = new List<CommitteeMember>();
                    }
                }

                var existingAssignments = await _context.DefenseAssignments
                    .Where(da => da.CommitteeCode != null && committeeCodes.Contains(da.CommitteeCode))
                    .ToListAsync();

                var assignmentsByCommittee = existingAssignments
                    .Where(da => da.CommitteeCode != null)
                    .GroupBy(da => da.CommitteeCode!)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var code in committeeCodes)
                {
                    if (!assignmentsByCommittee.ContainsKey(code))
                    {
                        assignmentsByCommittee[code] = new List<DefenseAssignment>();
                    }
                }

                var topicsQuery = _context.Topics.Where(t =>
                    t.Status == EligibleTopicStatus &&
                    !_context.DefenseAssignments.Any(da => da.TopicCode == t.TopicCode));

                if (dto.TopicCodes != null && dto.TopicCodes.Count > 0)
                {
                    topicsQuery = topicsQuery.Where(t => dto.TopicCodes.Contains(t.TopicCode));
                }

                var topics = await topicsQuery.ToListAsync();
                if (topics.Count == 0)
                {
                    return ApiResponse<AutoAssignResultDto>.Fail("Không có đề tài đủ điều kiện để phân hội đồng.");
                }

                var studentCodes = topics
                    .Where(t => !string.IsNullOrEmpty(t.ProposerStudentCode))
                    .Select(t => t.ProposerStudentCode!)
                    .Distinct()
                    .ToList();

                var studentProfiles = await _context.StudentProfiles
                    .Where(sp => studentCodes.Contains(sp.StudentCode))
                    .Include(sp => sp.User)
                    .ToListAsync();

                var studentLookup = studentProfiles
                    .ToDictionary(sp => sp.StudentCode, sp => sp.User?.FullName ?? sp.StudentCode);

                var supervisorCodes = topics
                    .Where(t => !string.IsNullOrEmpty(t.SupervisorLecturerCode))
                    .Select(t => t.SupervisorLecturerCode!)
                    .Distinct();

                var memberLecturerCodes = committeeMembers
                    .Where(cm => !string.IsNullOrEmpty(cm.MemberLecturerCode))
                    .Select(cm => cm.MemberLecturerCode!)
                    .Distinct();

                var lecturerCodes = supervisorCodes
                    .Concat(memberLecturerCodes)
                    .Distinct()
                    .ToList();

                var lecturerProfiles = await _context.LecturerProfiles
                    .Where(lp => lecturerCodes.Contains(lp.LecturerCode))
                    .Include(lp => lp.User)
                    .ToListAsync();

                var lecturerLookup = lecturerProfiles
                    .ToDictionary(lp => lp.LecturerCode, lp => lp.User?.FullName ?? lp.LecturerCode);

                var usedSlots = committeeCodes.ToDictionary(
                    code => code,
                    code => assignmentsByCommittee[code]
                        .Where(a => a.ScheduledAt.HasValue)
                        .Select(a => DateTime.SpecifyKind(a.ScheduledAt!.Value, DateTimeKind.Utc).ToString("yyyy-MM-dd HH:mm"))
                        .ToHashSet(StringComparer.OrdinalIgnoreCase));

                var newSlots = committeeCodes.ToDictionary(code => code, _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase));
                var assignmentCount = committeeCodes.ToDictionary(code => code, code => assignmentsByCommittee[code].Count);

                var newAssignments = new List<DefenseAssignment>();
                var assignmentDetails = new List<DefenseAssignmentDetailDto>();
                var notifications = new List<AssignmentNotificationDto>();
                var unassignedTopics = new List<UnassignedTopicDto>();

                foreach (var topic in topics)
                {
                    var candidates = committees
                        .Where(c => c.DefenseDate.HasValue)
                        .Where(c =>
                        {
                            var memberList = membersByCommittee[c.CommitteeCode];
                            if (memberList.Count < 4)
                            {
                                return false;
                            }

                            if (!string.IsNullOrEmpty(topic.SupervisorLecturerCode) &&
                                memberList.Any(m => m.MemberLecturerCode == topic.SupervisorLecturerCode))
                            {
                                return false;
                            }

                            return true;
                        })
                        .OrderBy(c => assignmentCount[c.CommitteeCode])
                        .ThenBy(c => c.DefenseDate)
                        .ToList();

                    if (candidates.Count == 0)
                    {
                        unassignedTopics.Add(new UnassignedTopicDto
                        {
                            TopicCode = topic.TopicCode,
                            Reason = "Không có hội đồng phù hợp hoặc hội đồng chưa đủ thành viên/ngày bảo vệ."
                        });
                        continue;
                    }

                    var assigned = false;

                    foreach (var committee in candidates)
                    {
                        if (assignmentCount[committee.CommitteeCode] >= MaxTopicsPerCommittee)
                        {
                            continue;
                        }

                        var baseDate = committee.DefenseDate!.Value.Date;
                        var sequenceIndex = assignmentCount[committee.CommitteeCode];
                        var sessionNumber = (sequenceIndex / TopicsPerSession) + 1;

                        if (sessionNumber > SessionsPerCommittee)
                        {
                            continue;
                        }

                        var positionInSession = sequenceIndex % TopicsPerSession;
                        if (!SessionStartLookup.TryGetValue(sessionNumber, out var sessionStart))
                        {
                            sessionStart = MorningSessionStart.Add(TimeSpan.FromMinutes((sessionNumber - 1) * slotMinutes));
                        }

                        var startOffset = TimeSpan.FromMinutes(slotMinutes * positionInSession);
                        var topicStart = sessionStart.Add(startOffset);
                        var topicEnd = topicStart.Add(TimeSpan.FromMinutes(slotMinutes));

                        var scheduledUtc = DateTime.SpecifyKind(baseDate.Add(topicStart), DateTimeKind.Utc);
                        var scheduleKey = scheduledUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

                        if (usedSlots[committee.CommitteeCode].Contains(scheduleKey) || newSlots[committee.CommitteeCode].Contains(scheduleKey))
                        {
                            continue;
                        }

                        var now = DateTime.UtcNow;
                        var assignmentCode = $"DA_{committee.CommitteeCode}_{topic.TopicCode}_{now.Ticks}";

                        var assignment = new DefenseAssignment
                        {
                            AssignmentCode = assignmentCode,
                            TopicCode = topic.TopicCode,
                            CommitteeCode = committee.CommitteeCode,
                            ScheduledAt = scheduledUtc,
                            Session = sessionNumber,
                            StartTime = topicStart,
                            EndTime = topicEnd,
                            AssignedAt = now,
                            CreatedAt = now,
                            LastUpdated = now
                        };

                        newAssignments.Add(assignment);
                        newSlots[committee.CommitteeCode].Add(scheduleKey);
                        assignmentCount[committee.CommitteeCode] += 1;

                        assignmentDetails.Add(new DefenseAssignmentDetailDto
                        {
                            AssignmentCode = assignmentCode,
                            TopicCode = topic.TopicCode,
                            TopicTitle = topic.Title,
                            CommitteeCode = committee.CommitteeCode,
                            CommitteeName = committee.Name ?? string.Empty,
                            ScheduledAt = scheduledUtc,
                            Session = sessionNumber,
                            StartTime = topicStart,
                            EndTime = topicEnd,
                            AssignedAt = now,
                            Room = committee.Room,
                            CreatedAt = now
                        });

                        if (!string.IsNullOrEmpty(topic.ProposerStudentCode))
                        {
                            var studentCode = topic.ProposerStudentCode;
                            var studentName = studentCode != null && studentLookup.TryGetValue(studentCode, out var lookupName)
                                ? lookupName
                                : studentCode ?? "Sinh viên";

                            notifications.Add(new AssignmentNotificationDto
                            {
                                RecipientType = "STUDENT",
                                RecipientCode = studentCode!,
                                RecipientName = studentName,
                                Message = $"Sinh viên {studentName} ({studentCode}) sẽ bảo vệ đề tài '{topic.Title}' vào {scheduledUtc:HH:mm dd/MM/yyyy} tại {committee.Room ?? "chưa cập nhật"}."
                            });
                        }

                        if (!string.IsNullOrEmpty(topic.SupervisorLecturerCode))
                        {
                            var supervisorCode = topic.SupervisorLecturerCode!;
                            var supervisorName = lecturerLookup.TryGetValue(supervisorCode, out var lookupName)
                                ? lookupName
                                : supervisorCode;

                            notifications.Add(new AssignmentNotificationDto
                            {
                                RecipientType = "LECTURER",
                                RecipientCode = supervisorCode,
                                RecipientName = supervisorName,
                                Message = $"Đề tài '{topic.Title}' do {supervisorName} hướng dẫn đã được xếp bảo vệ với hội đồng {committee.Name ?? committee.CommitteeCode} vào {scheduledUtc:HH:mm dd/MM/yyyy}."
                            });
                        }

                        if (membersByCommittee.TryGetValue(committee.CommitteeCode, out var memberListForCommittee))
                        {
                            foreach (var member in memberListForCommittee)
                            {
                                if (string.IsNullOrEmpty(member.MemberLecturerCode))
                                {
                                    continue;
                                }

                                var memberCode = member.MemberLecturerCode;
                                var memberName = lecturerLookup.TryGetValue(memberCode, out var name)
                                    ? name
                                    : memberCode;

                                notifications.Add(new AssignmentNotificationDto
                                {
                                    RecipientType = "COMMITTEE_MEMBER",
                                    RecipientCode = memberCode,
                                    RecipientName = memberName,
                                    Message = $"Hội đồng {committee.Name ?? committee.CommitteeCode} được bổ sung đề tài '{topic.Title}' vào {scheduledUtc:HH:mm dd/MM/yyyy}. Vai trò: {member.Role ?? "Thành viên"}."
                                });
                            }
                        }

                        var old = topic.Status;
                        topic.Status = AssignedTopicStatus;
                        // Log history
                        await _context.MilestoneStateHistories.AddAsync(new MilestoneStateHistory
                        {
                            MilestoneID = 0,
                            MilestoneCode = string.Empty,
                            TopicCode = topic.TopicCode,
                            OldState = old,
                            NewState = topic.Status,
                            ChangedByUserCode = dto.AssignedByUserCode ?? "system",
                            ChangedAt = DateTime.UtcNow,
                            Comment = "Assigned to committee"
                        });
                        topic.LastUpdated = now;

                        assigned = true;
                        break;
                    }

                    if (!assigned)
                    {
                        unassignedTopics.Add(new UnassignedTopicDto
                        {
                            TopicCode = topic.TopicCode,
                            Reason = "Không tìm được khung giờ phù hợp trong ngày bảo vệ của hội đồng."
                        });
                    }
                }

                if (newAssignments.Count == 0)
                {
                    return ApiResponse<AutoAssignResultDto>.Fail("Không thể phân công đề tài nào. Vui lòng kiểm tra lại điều kiện hội đồng và thời gian.");
                }

                await _context.DefenseAssignments.AddRangeAsync(newAssignments);
                await _context.SaveChangesAsync();

                var response = new AutoAssignResultDto
                {
                    AssignedCount = newAssignments.Count,
                    Assignments = assignmentDetails
                        .OrderBy(a => a.ScheduledAt)
                        .ToList(),
                    UnassignedTopics = unassignedTopics,
                    Notifications = notifications
                };

                return ApiResponse<AutoAssignResultDto>.SuccessResponse(response);
            }
            catch (Exception ex)
            {
                return ApiResponse<AutoAssignResultDto>.Fail($"Lỗi: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> ChangeAssignmentAsync(ChangeAssignmentDto dto)
        {
            try
            {
                var assignment = await _context.DefenseAssignments
                    .FirstOrDefaultAsync(da => da.TopicCode == dto.TopicCode);

                if (assignment == null)
                {
                    return ApiResponse<bool>.Fail("Đề tài chưa được phân hội đồng");
                }

                var committee = await _context.Committees
                    .FirstOrDefaultAsync(c => c.CommitteeCode == dto.TargetCommitteeCode);

                if (committee == null)
                {
                    return ApiResponse<bool>.Fail("Không tìm thấy hội đồng");
                }

                if (dto.ScheduledAt == default)
                {
                    return ApiResponse<bool>.Fail("Thời gian bảo vệ không hợp lệ");
                }

                if (!dto.Session.HasValue || dto.Session is < 1 or > SessionsPerCommittee)
                {
                    return ApiResponse<bool>.Fail("Buổi bảo vệ phải là 1 hoặc 2");
                }

                if (!dto.StartTime.HasValue || !dto.EndTime.HasValue)
                {
                    return ApiResponse<bool>.Fail("Thiếu giờ bắt đầu hoặc kết thúc cho đề tài");
                }

                if (dto.EndTime <= dto.StartTime)
                {
                    return ApiResponse<bool>.Fail("Giờ kết thúc phải lớn hơn giờ bắt đầu");
                }

                if (committee.DefenseDate.HasValue && dto.ScheduledAt.Date != committee.DefenseDate.Value.Date)
                {
                    return ApiResponse<bool>.Fail($"Thời gian bảo vệ phải nằm trong ngày {committee.DefenseDate.Value:dd/MM/yyyy}");
                }

                if (committee.DefenseDate.HasValue)
                {
                    var normalizedScheduled = DateTime.SpecifyKind(committee.DefenseDate.Value.Date.Add(dto.StartTime.Value), DateTimeKind.Utc);
                    if (dto.ScheduledAt != normalizedScheduled)
                    {
                        dto.ScheduledAt = normalizedScheduled;
                    }
                }

                var topic = await _context.Topics
                    .Where(t => t.TopicCode == dto.TopicCode)
                    .Select(t => new
                    {
                        t.TopicCode,
                        t.SupervisorLecturerCode,
                        t.Status
                    })
                    .FirstOrDefaultAsync();

                if (topic == null || (topic.Status != EligibleTopicStatus && topic.Status != AssignedTopicStatus))
                {
                    return ApiResponse<bool>.Fail("Đề tài không đủ điều kiện bảo vệ");
                }

                var committeeMembers = await _context.CommitteeMembers
                    .Where(cm => cm.CommitteeCode == dto.TargetCommitteeCode)
                    .Select(cm => cm.MemberLecturerCode)
                    .Where(code => code != null)
                    .Select(code => code!)
                    .ToListAsync();

                if (committeeMembers.Count == 0)
                {
                    return ApiResponse<bool>.Fail("Hội đồng chưa có thành viên");
                }

                if (!string.IsNullOrEmpty(topic.SupervisorLecturerCode) && committeeMembers.Contains(topic.SupervisorLecturerCode!))
                {
                    return ApiResponse<bool>.Fail("Giảng viên hướng dẫn đang ở trong hội đồng này");
                }

                var committeeTags = await _context.CommitteeTags
                    .Where(ct => ct.CommitteeCode == dto.TargetCommitteeCode)
                    .Select(ct => ct.TagCode)
                    .Where(code => code != null)
                    .Select(code => code!)
                    .Distinct()
                    .ToListAsync();

                if (committeeTags.Any())
                {
                    var topicTagsLookup = await GetTopicTagsLookupAsync(new[] { dto.TopicCode });
                    var topicTags = topicTagsLookup.TryGetValue(dto.TopicCode, out var tags)
                        ? tags
                        : new List<string>();

                    if (!topicTags.Any(tag => committeeTags.Contains(tag)))
                    {
                        return ApiResponse<bool>.Fail("Đề tài không khớp với chủ đề của hội đồng");
                    }
                }

                var slotKey = dto.ScheduledAt.ToString("yyyy-MM-dd HH:mm");
                var hasConflict = await _context.DefenseAssignments
                    .AnyAsync(da => da.CommitteeCode == dto.TargetCommitteeCode &&
                                     da.AssignmentID != assignment.AssignmentID &&
                                     da.ScheduledAt.HasValue &&
                                     da.ScheduledAt.Value.ToString("yyyy-MM-dd HH:mm") == slotKey);

                if (hasConflict)
                {
                    return ApiResponse<bool>.Fail("Khung giờ đã được sử dụng");
                }

                var sessionCount = await _context.DefenseAssignments
                    .CountAsync(da => da.CommitteeCode == dto.TargetCommitteeCode &&
                                     da.AssignmentID != assignment.AssignmentID &&
                                     da.Session == dto.Session);

                if (sessionCount >= TopicsPerSession)
                {
                    return ApiResponse<bool>.Fail($"Buổi số {dto.Session} đã có đủ {TopicsPerSession} đề tài.");
                }

                assignment.CommitteeCode = dto.TargetCommitteeCode;
                assignment.ScheduledAt = DateTime.SpecifyKind(dto.ScheduledAt, DateTimeKind.Utc);
                assignment.Session = dto.Session;
                assignment.StartTime = dto.StartTime;
                assignment.EndTime = dto.EndTime;
                assignment.LastUpdated = DateTime.UtcNow;
                assignment.AssignedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.Fail($"Lỗi: {ex.Message}");
            }
        }

        public async Task<ApiResponse<bool>> RemoveAssignmentAsync(RemoveAssignmentDto dto)
        {
            try
            {
                var assignment = await _context.DefenseAssignments
                    .FirstOrDefaultAsync(da => da.TopicCode == dto.TopicCode);

                if (assignment == null)
                {
                    return ApiResponse<bool>.Fail("Đề tài chưa được phân hội đồng");
                }

                var topic = await _context.Topics
                    .FirstOrDefaultAsync(t => t.TopicCode == dto.TopicCode);

                _context.DefenseAssignments.Remove(assignment);

                if (topic != null)
                {
                    var old = topic.Status;
                    topic.Status = EligibleTopicStatus;
                    await _context.MilestoneStateHistories.AddAsync(new MilestoneStateHistory
                    {
                        MilestoneID = 0,
                        MilestoneCode = string.Empty,
                        TopicCode = topic.TopicCode,
                        OldState = old,
                        NewState = topic.Status,
                        ChangedByUserCode = dto.AssignedByUserCode ?? "system",
                        ChangedAt = DateTime.UtcNow,
                        Comment = "Removed from committee / restored to eligible"
                    });
                    topic.LastUpdated = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.Fail($"Lỗi: {ex.Message}");
            }
        }

        private async Task<Dictionary<string, List<string>>> GetTopicTagsLookupAsync(IEnumerable<string> topicCodes)
        {
            var codes = topicCodes
                .Where(code => !string.IsNullOrWhiteSpace(code))
                .Select(code => code.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (codes.Count == 0)
            {
                return new Dictionary<string, List<string>>();
            }

            var tagRecords = await _context.TopicTags.AsNoTracking()
                .Where(tt => tt.TopicCode != null && codes.Contains(tt.TopicCode))
                .Select(tt => new { tt.TopicCode, tt.TagCode })
                .Where(x => x.TopicCode != null && x.TagCode != null)
                .ToListAsync();

            return tagRecords
                .GroupBy(x => x.TopicCode!)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.TagCode!).Distinct(StringComparer.OrdinalIgnoreCase).ToList());
        }

        // ============ GET COMMITTEE ASSIGNMENTS ============
        public async Task<ApiResponse<List<DefenseAssignmentDetailDto>>> GetCommitteeAssignmentsAsync(string committeeCode)
        {
            try
            {
                var assignments = await _context.DefenseAssignments
                    .Where(da => da.CommitteeCode == committeeCode)
                    .Join(_context.Topics,
                        da => da.TopicCode,
                        t => t.TopicCode,
                        (da, t) => new { da, t })
                    .Join(_context.Committees,
                        x => x.da.CommitteeCode,
                        c => c.CommitteeCode,
                        (x, c) => new DefenseAssignmentDetailDto
                        {
                            AssignmentCode = x.da.AssignmentCode,
                            TopicCode = x.t.TopicCode,
                            TopicTitle = x.t.Title,
                            CommitteeCode = c.CommitteeCode,
                            CommitteeName = c.Name ?? "",
                            ScheduledAt = x.da.ScheduledAt,
                            Session = x.da.Session,
                            StartTime = x.da.StartTime,
                            EndTime = x.da.EndTime,
                            AssignedAt = x.da.AssignedAt,
                            Room = c.Room,
                            CreatedAt = x.da.CreatedAt
                        })
                    .OrderBy(a => a.ScheduledAt)
                    .ToListAsync();

                if (assignments.Count > 0)
                {
                    var assignmentTopicCodes = assignments.Select(a => a.TopicCode).ToList();
                    var tagLookup = await GetTopicTagsLookupAsync(assignmentTopicCodes);

                    foreach (var assignment in assignments)
                    {
                        if (tagLookup.TryGetValue(assignment.TopicCode, out var tags))
                        {
                            assignment.TagCodes = tags;
                        }
                    }
                }

                return ApiResponse<List<DefenseAssignmentDetailDto>>.SuccessResponse(assignments);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<DefenseAssignmentDetailDto>>.Fail($"Lỗi: {ex.Message}");
            }
        }
    }
}
#endif

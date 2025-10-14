using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
    }

    public class DefenseAssignmentService : IDefenseAssignmentService
    {
        private readonly ApplicationDbContext _context;

        public DefenseAssignmentService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============ GET AVAILABLE TOPICS ============
        public async Task<ApiResponse<List<AvailableTopicDto>>> GetAvailableTopicsAsync()
        {
            try
            {
                // Topics with Status = "Đã duyệt" and not yet assigned
                var assignedTopicCodes = await _context.DefenseAssignments
                    .Select(da => da.TopicCode)
                    .ToListAsync();

                var availableTopics = await _context.Topics
                    .Where(t => t.Status == "Đã duyệt" && !assignedTopicCodes.Contains(t.TopicCode))
                    .GroupJoin(_context.StudentProfiles,
                        t => t.ProposerStudentCode,
                        sp => sp.StudentCode,
                        (t, sp) => new { t, sp = sp.FirstOrDefault() })
                    .GroupJoin(_context.Users,
                        x => x.sp != null ? x.sp.UserCode : null,
                        u => u.UserCode,
                        (x, u) => new { x.t, x.sp, StudentUser = u.FirstOrDefault() })
                    .GroupJoin(_context.LecturerProfiles,
                        x => x.t.SupervisorLecturerCode,
                        lp => lp.LecturerCode,
                        (x, lp) => new { x.t, x.StudentUser, lp = lp.FirstOrDefault() })
                    .GroupJoin(_context.StudentProfiles,
                        x => x.t.ProposerStudentCode,
                        sp => sp.StudentCode,
                        (x, sp) => new { x.t, x.StudentUser, x.lp, sp = sp.FirstOrDefault() })
                    .Select(x => new AvailableTopicDto
                        {
                            TopicCode = x.t.TopicCode,
                            Title = x.t.Title,
                            Summary = x.t.Summary,
                            ProposerStudentCode = x.t.ProposerStudentCode,
                            StudentName = x.sp != null ? x.sp.FullName : null,
                            SupervisorLecturerCode = x.t.SupervisorLecturerCode,
                            SupervisorName = x.lp != null ? x.lp.FullName : null,
                            DepartmentCode = x.t.DepartmentCode,
                            Status = x.t.Status
                        })
                    .ToListAsync();

                return ApiResponse<List<AvailableTopicDto>>.SuccessResponse(availableTopics);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AvailableTopicDto>>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ ASSIGN TOPICS TO COMMITTEE ============
        public async Task<ApiResponse<bool>> AssignTopicsAsync(AssignDefenseDto dto)
        {
            try
            {
                // Validate committee exists
                var committee = await _context.Committees
                    .FirstOrDefaultAsync(c => c.CommitteeCode == dto.CommitteeCode);

                if (committee == null)
                {
                    return ApiResponse<bool>.Fail("Không tìm thấy hội đồng");
                }

                // Get committee members
                var committeeMembers = await _context.CommitteeMembers
                    .Where(cm => cm.CommitteeCode == dto.CommitteeCode)
                    .ToListAsync();

                if (committeeMembers.Count == 0)
                {
                    return ApiResponse<bool>.Fail("Hội đồng chưa có thành viên");
                }

                var committeeLecturerCodes = committeeMembers
                    .Select(cm => cm.MemberLecturerCode)
                    .Where(code => code != null)
                    .ToList();

                // Validate all topics
                var topicCodes = dto.Topics.Select(t => t.TopicCode).ToList();
                var topics = await _context.Topics
                    .Where(t => topicCodes.Contains(t.TopicCode))
                    .ToListAsync();

                if (topics.Count != dto.Topics.Count)
                {
                    return ApiResponse<bool>.Fail("Một hoặc nhiều đề tài không tồn tại");
                }

                // Check if any topic already assigned
                var alreadyAssigned = await _context.DefenseAssignments
                    .Where(da => da.TopicCode != null && topicCodes.Contains(da.TopicCode))
                    .ToListAsync();

                if (alreadyAssigned.Any())
                {
                    var assignedCodes = string.Join(", ", alreadyAssigned.Select(da => da.TopicCode));
                    return ApiResponse<bool>.Fail($"Các đề tài sau đã được phân hội đồng: {assignedCodes}");
                }

                // Validate: Supervisor cannot be in the committee
                foreach (var topic in topics)
                {
                    if (!string.IsNullOrEmpty(topic.SupervisorLecturerCode) && 
                        committeeLecturerCodes.Contains(topic.SupervisorLecturerCode))
                    {
                        return ApiResponse<bool>.Fail($"Đề tài '{topic.TopicCode}' không thể phân cho hội đồng này vì giảng viên hướng dẫn '{topic.SupervisorLecturerCode}' đang là thành viên hội đồng");
                    }
                }

                // Validate: All ScheduledAt must be within DefenseDate
                if (committee.DefenseDate.HasValue)
                {
                    foreach (var topicAssignment in dto.Topics)
                    {
                        if (topicAssignment.ScheduledAt.Date != committee.DefenseDate.Value.Date)
                        {
                            return ApiResponse<bool>.Fail($"Lịch bảo vệ của đề tài '{topicAssignment.TopicCode}' phải nằm trong ngày bảo vệ của hội đồng ({committee.DefenseDate.Value:dd/MM/yyyy})");
                        }
                    }
                }

                // Validate: No time conflicts within same committee + room
                var scheduledTimes = dto.Topics.Select(t => t.ScheduledAt).ToList();
                var duplicateTimes = scheduledTimes.GroupBy(t => t).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                
                if (duplicateTimes.Any())
                {
                    return ApiResponse<bool>.Fail($"Phát hiện trùng giờ bảo vệ trong cùng hội đồng: {string.Join(", ", duplicateTimes.Select(t => t.ToString("HH:mm")))}");
                }

                // Create assignments
                foreach (var topicAssignment in dto.Topics)
                {
                    var assignmentCode = $"DA_{dto.CommitteeCode}_{topicAssignment.TopicCode}_{DateTime.Now.Ticks}";

                    var assignment = new DefenseAssignment
                    {
                        AssignmentCode = assignmentCode,
                        TopicCode = topicAssignment.TopicCode,
                        CommitteeCode = dto.CommitteeCode,
                        ScheduledAt = topicAssignment.ScheduledAt,
                        CreatedAt = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow
                    };

                    _context.DefenseAssignments.Add(assignment);
                }

                await _context.SaveChangesAsync();
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.Fail($"Lỗi: {ex.Message}");
            }
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
                            Room = c.Room,
                            CreatedAt = x.da.CreatedAt
                        })
                    .OrderBy(a => a.ScheduledAt)
                    .ToListAsync();

                return ApiResponse<List<DefenseAssignmentDetailDto>>.SuccessResponse(assignments);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<DefenseAssignmentDetailDto>>.Fail($"Lỗi: {ex.Message}");
            }
        }
    }
}

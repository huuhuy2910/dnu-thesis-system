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
    public interface ICommitteeManagementService
    {
        Task<ApiResponse<CommitteeDetailDto>> CreateCommitteeAsync(CreateCommitteeDto dto);
        Task<ApiResponse<bool>> AddMembersAsync(AddCommitteeMembersDto dto);
        Task<ApiResponse<CommitteeDetailDto>> GetCommitteeDetailAsync(string committeeCode);
        Task<ApiResponse<List<AvailableLecturerDto>>> GetAvailableLecturersAsync(string? departmentCode = null, string? specialty = null);
        Task<ApiResponse<LecturerCommitteesDto>> GetLecturerCommitteesAsync(string lecturerCode);
        Task<ApiResponse<StudentDefenseInfoDto>> GetStudentDefenseInfoAsync(string studentCode);
    }

    public class CommitteeManagementService : ICommitteeManagementService
    {
        private readonly ApplicationDbContext _context;

        public CommitteeManagementService(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============ CREATE COMMITTEE ============
        public async Task<ApiResponse<CommitteeDetailDto>> CreateCommitteeAsync(CreateCommitteeDto dto)
        {
            try
            {
                // Check if committee code already exists
                var exists = await _context.Committees.AnyAsync(c => c.CommitteeCode == dto.CommitteeCode);
                if (exists)
                {
                    return ApiResponse<CommitteeDetailDto>.Fail($"Mã hội đồng '{dto.CommitteeCode}' đã tồn tại");
                }

                var committee = new Committee
                {
                    CommitteeCode = dto.CommitteeCode,
                    Name = dto.Name,
                    DefenseDate = dto.DefenseDate,
                    Room = dto.Room,
                    CreatedAt = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                };

                _context.Committees.Add(committee);
                await _context.SaveChangesAsync();

                var result = new CommitteeDetailDto
                {
                    CommitteeCode = committee.CommitteeCode,
                    Name = committee.Name ?? "",
                    DefenseDate = committee.DefenseDate,
                    Room = committee.Room,
                    Members = new List<CommitteeMemberDetailDto>(),
                    AssignedTopics = new List<DefenseTopicDto>()
                };

                return ApiResponse<CommitteeDetailDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<CommitteeDetailDto>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ ADD MEMBERS ============
        public async Task<ApiResponse<bool>> AddMembersAsync(AddCommitteeMembersDto dto)
        {
            try
            {
                var committee = await _context.Committees
                    .FirstOrDefaultAsync(c => c.CommitteeCode == dto.CommitteeCode);

                if (committee == null)
                {
                    return ApiResponse<bool>.Fail("Không tìm thấy hội đồng");
                }

                // Validate: 4-5 members
                if (dto.Members.Count < 4 || dto.Members.Count > 5)
                {
                    return ApiResponse<bool>.Fail("Hội đồng phải có từ 4-5 thành viên");
                }

                // Validate: exactly 1 Chairman
                var chairCount = dto.Members.Count(m => m.Role.Contains("Chủ tịch"));
                if (chairCount != 1)
                {
                    return ApiResponse<bool>.Fail("Hội đồng phải có đúng 1 Chủ tịch");
                }

                // Validate: exactly 1 Secretary
                var secretaryCount = dto.Members.Count(m => m.Role.Contains("Thư ký"));
                if (secretaryCount != 1)
                {
                    return ApiResponse<bool>.Fail("Hội đồng phải có đúng 1 Thư ký");
                }

                // Fetch all lecturers
                var lecturerIds = dto.Members.Select(m => m.LecturerProfileID).ToList();
                var lecturers = await _context.LecturerProfiles
                    .Include(l => l.User)
                    .Where(l => lecturerIds.Contains(l.LecturerProfileID))
                    .ToListAsync();

                if (lecturers.Count != dto.Members.Count)
                {
                    return ApiResponse<bool>.Fail("Một hoặc nhiều giảng viên không tồn tại");
                }

                // Validate: Chairman must have PhD
                foreach (var member in dto.Members)
                {
                    var lecturer = lecturers.First(l => l.LecturerProfileID == member.LecturerProfileID);

                    if (member.Role.Contains("Chủ tịch"))
                    {
                        if (lecturer.Degree == null || !lecturer.Degree.Contains("Tiến sĩ"))
                        {
                            return ApiResponse<bool>.Fail($"Chủ tịch phải có học vị Tiến sĩ. Giảng viên {lecturer.LecturerCode} không đủ điều kiện");
                        }
                    }
                }

                // Check for duplicates
                var existingMembers = await _context.CommitteeMembers
                    .Where(cm => cm.CommitteeCode == dto.CommitteeCode)
                    .ToListAsync();

                if (existingMembers.Any())
                {
                    return ApiResponse<bool>.Fail("Hội đồng đã có thành viên. Vui lòng xóa trước khi thêm mới");
                }

                // Add members
                foreach (var member in dto.Members)
                {
                    var lecturer = lecturers.First(l => l.LecturerProfileID == member.LecturerProfileID);

                    var committeeMember = new CommitteeMember
                    {
                        CommitteeID = committee.CommitteeID,
                        CommitteeCode = committee.CommitteeCode,
                        MemberLecturerProfileID = lecturer.LecturerProfileID,
                        MemberLecturerCode = lecturer.LecturerCode,
                        MemberUserID = lecturer.User?.UserID, // FIX: Set MemberUserID from User
                        MemberUserCode = lecturer.UserCode,
                        Role = member.Role,
                        IsChair = member.Role.Contains("Chủ tịch"),
                        CreatedAt = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow
                    };

                    _context.CommitteeMembers.Add(committeeMember);
                }

                await _context.SaveChangesAsync();
                return ApiResponse<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return ApiResponse<bool>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ GET COMMITTEE DETAIL ============
        public async Task<ApiResponse<CommitteeDetailDto>> GetCommitteeDetailAsync(string committeeCode)
        {
            try
            {
                var committee = await _context.Committees
                    .FirstOrDefaultAsync(c => c.CommitteeCode == committeeCode);

                if (committee == null)
                {
                    return ApiResponse<CommitteeDetailDto>.Fail("Không tìm thấy hội đồng");
                }

                // Get members
                var members = await _context.CommitteeMembers
                    .Where(cm => cm.CommitteeCode == committeeCode)
                    .Join(_context.LecturerProfiles,
                        cm => cm.MemberLecturerProfileID,
                        lp => lp.LecturerProfileID,
                        (cm, lp) => new CommitteeMemberDetailDto
                        {
                            CommitteeMemberID = cm.CommitteeMemberID,
                            LecturerCode = lp.LecturerCode,
                            LecturerName = lp.FullName ?? "",
                            Degree = lp.Degree,
                            Role = cm.Role ?? "",
                            IsChair = cm.IsChair ?? false
                        })
                    .ToListAsync();

                // Get assigned topics
                var topics = await _context.DefenseAssignments
                    .Where(da => da.CommitteeCode == committeeCode)
                    .Join(_context.Topics,
                        da => da.TopicCode,
                        t => t.TopicCode,
                        (da, t) => new { da, t })
                    .GroupJoin(_context.StudentProfiles,
                        x => x.t.ProposerStudentCode,
                        sp => sp.StudentCode,
                        (x, sp) => new DefenseTopicDto
                        {
                            TopicCode = x.t.TopicCode,
                            Title = x.t.Title,
                            StudentCode = x.t.ProposerStudentCode,
                            StudentName = sp.FirstOrDefault() != null ? sp.FirstOrDefault()!.FullName : null,
                            ScheduledAt = x.da.ScheduledAt
                        })
                    .ToListAsync();

                var result = new CommitteeDetailDto
                {
                    CommitteeCode = committee.CommitteeCode,
                    Name = committee.Name ?? "",
                    DefenseDate = committee.DefenseDate,
                    Room = committee.Room,
                    Members = members,
                    AssignedTopics = topics
                };

                return ApiResponse<CommitteeDetailDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<CommitteeDetailDto>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ GET AVAILABLE LECTURERS ============
        public async Task<ApiResponse<List<AvailableLecturerDto>>> GetAvailableLecturersAsync(string? departmentCode = null, string? specialty = null)
        {
            try
            {
                var query = _context.LecturerProfiles.AsQueryable();

                if (!string.IsNullOrEmpty(departmentCode))
                {
                    query = query.Where(l => l.DepartmentCode == departmentCode);
                }

                if (!string.IsNullOrEmpty(specialty))
                {
                    query = query.Where(l => l.Specialties != null && l.Specialties.Contains(specialty));
                }

                var lecturers = await query
                    .Select(lp => new AvailableLecturerDto
                    {
                        LecturerProfileID = lp.LecturerProfileID,
                        LecturerCode = lp.LecturerCode,
                        FullName = lp.FullName ?? "",
                        Degree = lp.Degree,
                        DepartmentCode = lp.DepartmentCode,
                        Specialties = lp.Specialties,
                        CurrentDefenseCount = _context.CommitteeMembers.Count(cm => cm.MemberLecturerCode == lp.LecturerCode),
                        IsEligibleForChair = lp.Degree != null && lp.Degree.Contains("Tiến sĩ")
                    })
                    .OrderBy(l => l.CurrentDefenseCount)
                    .ToListAsync();

                return ApiResponse<List<AvailableLecturerDto>>.SuccessResponse(lecturers);
            }
            catch (Exception ex)
            {
                return ApiResponse<List<AvailableLecturerDto>>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ LECTURER VIEW COMMITTEES ============
        public async Task<ApiResponse<LecturerCommitteesDto>> GetLecturerCommitteesAsync(string lecturerCode)
        {
            try
            {
                var lecturer = await _context.LecturerProfiles
                    .Include(l => l.User)
                    .FirstOrDefaultAsync(l => l.LecturerCode == lecturerCode);

                if (lecturer == null)
                {
                    return ApiResponse<LecturerCommitteesDto>.Fail("Không tìm thấy giảng viên");
                }

                var committees = await _context.CommitteeMembers
                    .Where(cm => cm.MemberLecturerCode == lecturerCode)
                    .Join(_context.Committees,
                        cm => cm.CommitteeCode,
                        c => c.CommitteeCode,
                        (cm, c) => new { cm, c })
                    .Select(x => new LecturerCommitteeItemDto
                    {
                        CommitteeCode = x.c.CommitteeCode,
                        Name = x.c.Name ?? "",
                        Role = x.cm.Role ?? "",
                        DefenseDate = x.c.DefenseDate,
                        Room = x.c.Room,
                        AssignedTopics = _context.DefenseAssignments
                            .Where(da => da.CommitteeCode == x.c.CommitteeCode)
                            .Join(_context.Topics,
                                da => da.TopicCode,
                                t => t.TopicCode,
                                (da, t) => new { da, t })
                            .GroupJoin(_context.StudentProfiles,
                                y => y.t.ProposerStudentCode,
                                sp => sp.StudentCode,
                                (y, sp) => new DefenseTopicDto
                                {
                                    TopicCode = y.t.TopicCode,
                                    Title = y.t.Title,
                                    StudentCode = y.t.ProposerStudentCode,
                                    StudentName = sp.FirstOrDefault() != null ? sp.FirstOrDefault()!.FullName : null,
                                    ScheduledAt = y.da.ScheduledAt
                                })
                            .ToList()
                    })
                    .ToListAsync();

                var result = new LecturerCommitteesDto
                {
                    LecturerCode = lecturerCode,
                    LecturerName = lecturer.FullName ?? "",
                    Committees = committees
                };

                return ApiResponse<LecturerCommitteesDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<LecturerCommitteesDto>.Fail($"Lỗi: {ex.Message}");
            }
        }

        // ============ STUDENT VIEW DEFENSE INFO ============
        public async Task<ApiResponse<StudentDefenseInfoDto>> GetStudentDefenseInfoAsync(string studentCode)
        {
            try
            {
                var student = await _context.StudentProfiles
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentCode == studentCode);

                if (student == null)
                {
                    return ApiResponse<StudentDefenseInfoDto>.Fail("Không tìm thấy sinh viên");
                }

                // Find topic by student
                var topic = await _context.Topics
                    .FirstOrDefaultAsync(t => t.ProposerStudentCode == studentCode);

                if (topic == null)
                {
                    return ApiResponse<StudentDefenseInfoDto>.Fail("Sinh viên chưa có đề tài");
                }

                // Find defense assignment
                var assignment = await _context.DefenseAssignments
                    .FirstOrDefaultAsync(da => da.TopicCode == topic.TopicCode);

                StudentCommitteeDto? committeeDto = null;

                if (assignment != null && !string.IsNullOrEmpty(assignment.CommitteeCode))
                {
                    var committee = await _context.Committees
                        .FirstOrDefaultAsync(c => c.CommitteeCode == assignment.CommitteeCode);

                    if (committee != null)
                    {
                        var members = await _context.CommitteeMembers
                            .Where(cm => cm.CommitteeCode == committee.CommitteeCode)
                            .Join(_context.LecturerProfiles,
                                cm => cm.MemberLecturerProfileID,
                                lp => lp.LecturerProfileID,
                                (cm, lp) => new CommitteeMemberDetailDto
                                {
                                    CommitteeMemberID = cm.CommitteeMemberID,
                                    LecturerCode = lp.LecturerCode,
                                    LecturerName = lp.FullName ?? "",
                                    Degree = lp.Degree,
                                    Role = cm.Role ?? "",
                                    IsChair = cm.IsChair ?? false
                                })
                            .ToListAsync();

                        committeeDto = new StudentCommitteeDto
                        {
                            CommitteeCode = committee.CommitteeCode,
                            Name = committee.Name ?? "",
                            DefenseDate = committee.DefenseDate,
                            Room = committee.Room,
                            Members = members
                        };
                    }
                }

                var result = new StudentDefenseInfoDto
                {
                    StudentCode = studentCode,
                    StudentName = student.FullName ?? "",
                    Topic = new StudentTopicDto
                    {
                        TopicCode = topic.TopicCode,
                        Title = topic.Title,
                        Summary = topic.Summary
                    },
                    Committee = committeeDto,
                    ScheduledAt = assignment?.ScheduledAt
                };

                return ApiResponse<StudentDefenseInfoDto>.SuccessResponse(result);
            }
            catch (Exception ex)
            {
                return ApiResponse<StudentDefenseInfoDto>.Fail($"Lỗi: {ex.Message}");
            }
        }
    }
}

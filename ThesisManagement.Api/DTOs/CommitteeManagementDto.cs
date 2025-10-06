using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs
{
    // ============ CREATE COMMITTEE ============
    public class CreateCommitteeDto
    {
        [Required]
        [StringLength(50)]
        public string CommitteeCode { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = null!;

        public DateTime? DefenseDate { get; set; }

        [StringLength(50)]
        public string? Room { get; set; }
    }

    // ============ ADD MEMBERS ============
    public class AddCommitteeMembersDto
    {
        [Required]
        public string CommitteeCode { get; set; } = null!;

        [Required]
        [MinLength(4)]
        [MaxLength(5)]
        public List<CommitteeMemberInputDto> Members { get; set; } = new();
    }

    public class CommitteeMemberInputDto
    {
        public int LecturerProfileID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Role { get; set; } = null!; // "Chủ tịch", "Thư ký", "Phản biện"
    }

    // ============ COMMITTEE DETAIL DTO ============
    public class CommitteeDetailDto
    {
        public string CommitteeCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public List<CommitteeMemberDetailDto> Members { get; set; } = new();
        public List<DefenseTopicDto> AssignedTopics { get; set; } = new();
    }

    public class CommitteeMemberDetailDto
    {
        public int CommitteeMemberID { get; set; }
        public string LecturerCode { get; set; } = null!;
        public string LecturerName { get; set; } = null!;
        public string? Degree { get; set; }
        public string Role { get; set; } = null!;
        public bool IsChair { get; set; }
    }

    public class DefenseTopicDto
    {
        public string TopicCode { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? StudentCode { get; set; }
        public string? StudentName { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    // ============ LECTURER VIEW COMMITTEES ============
    public class LecturerCommitteesDto
    {
        public string LecturerCode { get; set; } = null!;
        public string LecturerName { get; set; } = null!;
        public List<LecturerCommitteeItemDto> Committees { get; set; } = new();
    }

    public class LecturerCommitteeItemDto
    {
        public string CommitteeCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public List<DefenseTopicDto> AssignedTopics { get; set; } = new();
    }

    // ============ STUDENT DEFENSE INFO ============
    public class StudentDefenseInfoDto
    {
        public string StudentCode { get; set; } = null!;
        public string StudentName { get; set; } = null!;
        public StudentTopicDto? Topic { get; set; }
        public StudentCommitteeDto? Committee { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    public class StudentTopicDto
    {
        public string TopicCode { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Summary { get; set; }
    }

    public class StudentCommitteeDto
    {
        public string CommitteeCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public List<CommitteeMemberDetailDto> Members { get; set; } = new();
    }

    // ============ AVAILABLE LECTURERS FOR COMMITTEE ============
    public class AvailableLecturerDto
    {
        public int LecturerProfileID { get; set; }
        public string LecturerCode { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? Degree { get; set; }
        public string? DepartmentCode { get; set; }
        public string? Specialties { get; set; }
        public int CurrentDefenseCount { get; set; } // Số hội đồng đang tham gia
        public bool IsEligibleForChair { get; set; } // Tiến sĩ
    }
}

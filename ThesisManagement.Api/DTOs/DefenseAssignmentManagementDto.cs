using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs
{
    // ============ ASSIGN TOPICS TO COMMITTEE ============
    public class AssignDefenseDto
    {
        [Required]
        public string CommitteeCode { get; set; } = null!;

        [Required]
        [MinLength(1)]
        public List<TopicAssignmentDto> Topics { get; set; } = new();

        [Required]
        public string AssignedBy { get; set; } = null!; // Admin username
    }

    public class TopicAssignmentDto
    {
        [Required]
        public string TopicCode { get; set; } = null!;

        [Required]
        public DateTime ScheduledAt { get; set; }
    }

    // ============ AVAILABLE TOPICS (not assigned yet) ============
    public class AvailableTopicDto
    {
        public string TopicCode { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Summary { get; set; }
        public string? ProposerStudentCode { get; set; }
        public string? StudentName { get; set; }
        public string? SupervisorLecturerCode { get; set; }
        public string? SupervisorName { get; set; }
        public string? DepartmentCode { get; set; }
        public string? Status { get; set; }
    }

    // ============ DEFENSE ASSIGNMENT DETAIL ============
    public class DefenseAssignmentDetailDto
    {
        public string AssignmentCode { get; set; } = null!;
        public string TopicCode { get; set; } = null!;
        public string TopicTitle { get; set; } = null!;
        public string CommitteeCode { get; set; } = null!;
        public string CommitteeName { get; set; } = null!;
        public DateTime? ScheduledAt { get; set; }
        public string? Room { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

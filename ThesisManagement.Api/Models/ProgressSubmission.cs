using System;

namespace ThesisManagement.Api.Models
{
    public class ProgressSubmission
    {
        public int SubmissionID { get; set; }
        public string SubmissionCode { get; set; } = null!;
        public string? MilestoneCode { get; set; } // New: reference by code
        public string? StudentUserCode { get; set; } // New: reference by code
        public string? StudentProfileCode { get; set; } // New: reference by code
        public string? FileURL { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? LecturerComment { get; set; }
        public string? LecturerState { get; set; }
        public string? FeedbackLevel { get; set; }
        public DateTime LastUpdated { get; set; }

        public ProgressMilestone? Milestone { get; set; }
        public User? StudentUser { get; set; }
        // Navigation property removed to prevent EF shadow properties
        // public StudentProfile? StudentProfile { get; set; }
    }
}

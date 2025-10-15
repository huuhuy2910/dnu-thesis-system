using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class ProgressSubmission
    {
        public int SubmissionID { get; set; }
        public string SubmissionCode { get; set; } = null!;
    public int? MilestoneID { get; set; }
        public string? MilestoneCode { get; set; } // New: reference by code
    public int? StudentUserID { get; set; }
        public string? StudentUserCode { get; set; } // New: reference by code
    public int? StudentProfileID { get; set; }
        public string? StudentProfileCode { get; set; } // New: reference by code
        public DateTime? SubmittedAt { get; set; }
        public int? AttemptNumber { get; set; }
    // File attachments are stored in SubmissionFiles table; do not map file columns on ProgressSubmission
        public string? LecturerComment { get; set; }
        public string? LecturerState { get; set; }
        public string? FeedbackLevel { get; set; }
        public string? ReportTitle { get; set; }
        public string? ReportDescription { get; set; }
        public DateTime LastUpdated { get; set; }

        public ProgressMilestone? Milestone { get; set; }
        public User? StudentUser { get; set; }
        public ICollection<SubmissionFile>? SubmissionFiles { get; set; }
        // Navigation property removed to prevent EF shadow properties
        // public StudentProfile? StudentProfile { get; set; }
    }
}

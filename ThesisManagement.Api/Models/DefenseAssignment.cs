using System;

namespace ThesisManagement.Api.Models
{
    public class DefenseAssignment
    {
        public int AssignmentID { get; set; }
        public string AssignmentCode { get; set; } = null!;
        public string? TopicCode { get; set; } // New: reference by code
        public string? CommitteeCode { get; set; } // New: reference by code
        public DateTime? ScheduledAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

    public Topic? Topic { get; set; }
    public Committee? Committee { get; set; }
    // Navigation collection removed to tránh EF tạo cột shadow (DefenseAssignmentAssignmentID)
    // public ICollection<DefenseScore>? DefenseScores { get; set; }
    }
}

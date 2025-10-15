using System;

namespace ThesisManagement.Api.Models
{
    public class DefenseAssignment
    {
        public int AssignmentID { get; set; }
        public string AssignmentCode { get; set; } = null!;
        // Ensure TopicID is present so we can store numeric FK when DB expects it
        public int? TopicID { get; set; }
        public string? TopicCode { get; set; }
    // Numeric FK for Committee to avoid null/ghost inserts
    public int? CommitteeID { get; set; }
        public string? CommitteeCode { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int? Session { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public string? AssignedBy { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public Committee? Committee { get; set; }
        // Navigation collection removed to tránh EF tạo cột shadow (DefenseAssignmentAssignmentID)
        // public ICollection<DefenseScore>? DefenseScores { get; set; }
    }
}

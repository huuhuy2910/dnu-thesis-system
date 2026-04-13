using System;

namespace ThesisManagement.Api.Models
{
    public class DefenseAssignment
    {
        public int AssignmentID { get; set; }
        public string AssignmentCode { get; set; } = null!;
        public int? TopicID { get; set; }
        public string? TopicCode { get; set; }
        public int? CommitteeID { get; set; }
        public int? DefenseTermId { get; set; }
        public string? CommitteeCode { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int? Session { get; set; }
        public string? Shift { get; set; }
        public int? OrderIndex { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public string? AssignedBy { get; set; }
        public DateTime? AssignedAt { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public Committee? Committee { get; set; }
        public DefenseTerm? DefenseTerm { get; set; }
    }
}

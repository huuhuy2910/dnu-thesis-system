using System;

namespace ThesisManagement.Api.Models
{
    public class ProgressMilestone
    {
        public int MilestoneID { get; set; }
        public string MilestoneCode { get; set; } = null!;
        public string? TopicCode { get; set; } // New: reference by code
        public string Type { get; set; } = null!;
        public DateTime? Deadline { get; set; }
        public string? State { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public ICollection<ProgressSubmission>? ProgressSubmissions { get; set; }
    }
}

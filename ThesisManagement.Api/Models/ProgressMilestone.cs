using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class ProgressMilestone
    {
        public int MilestoneID { get; set; }
        public string MilestoneCode { get; set; } = null!;
    public int? TopicID { get; set; }
        public string? TopicCode { get; set; } // New: reference by code
        public string? MilestoneTemplateCode { get; set; }
        public int? Ordinal { get; set; }
        public DateTime? Deadline { get; set; }
        public string? State { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public ICollection<ProgressSubmission>? ProgressSubmissions { get; set; }
        public MilestoneTemplate? MilestoneTemplate { get; set; }
        public ICollection<MilestoneStateHistory>? StateHistories { get; set; }
    }
}

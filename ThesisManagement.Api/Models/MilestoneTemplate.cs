using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class MilestoneTemplate
    {
        public int MilestoneTemplateID { get; set; }
        public string MilestoneTemplateCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int Ordinal { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUpdated { get; set; }

        public ICollection<ProgressMilestone>? ProgressMilestones { get; set; }
    }
}

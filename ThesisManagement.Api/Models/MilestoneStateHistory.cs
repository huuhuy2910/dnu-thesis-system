using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("MilestoneStateHistory")]
    public class MilestoneStateHistory
    {
        public int HistoryID { get; set; }
        public int MilestoneID { get; set; }
        public string? MilestoneCode { get; set; }
        public string? TopicCode { get; set; }
        public string? OldState { get; set; }
        public string NewState { get; set; } = null!;
        public string? ChangedByUserCode { get; set; }
        public int? ChangedByUserID { get; set; }
        public DateTime ChangedAt { get; set; }
        public string? Comment { get; set; }

        public ProgressMilestone? Milestone { get; set; }
    }
}

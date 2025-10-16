using System;

namespace ThesisManagement.Api.DTOs
{
    public class MilestoneStateHistoryFilter : BaseFilter
    {
        public int? MilestoneID { get; set; }
        public string? MilestoneCode { get; set; }
        public string? TopicCode { get; set; }
        public string? OldState { get; set; }
        public string? NewState { get; set; }
        public string? ChangedByUserCode { get; set; }
        public int? ChangedByUserID { get; set; }
        public DateTime? ChangedFrom { get; set; }
        public DateTime? ChangedTo { get; set; }
    }
}

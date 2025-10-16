namespace ThesisManagement.Api.DTOs
{
    public class ProgressMilestoneFilter : BaseFilter
    {
    public int? TopicID { get; set; }
    public string? TopicCode { get; set; }
        public string? MilestoneTemplateCode { get; set; }
        public string? State { get; set; }
        public string? MilestoneCode { get; set; }
        public DateTime? Deadline { get; set; }
        public int? MinOrdinal { get; set; }
        public int? MaxOrdinal { get; set; }
        public DateTime? StartedFrom { get; set; }
        public DateTime? StartedTo { get; set; }
        public DateTime? CompletedFrom { get; set; }
        public DateTime? CompletedTo { get; set; }
    }
}
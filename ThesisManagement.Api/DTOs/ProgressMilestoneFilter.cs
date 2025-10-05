namespace ThesisManagement.Api.DTOs
{
    public class ProgressMilestoneFilter : BaseFilter
    {
        public string? TopicCode { get; set; }
        public string? Type { get; set; }
        public string? State { get; set; }
        public string? MilestoneCode { get; set; }
        public DateTime? Deadline { get; set; }
    }
}
namespace ThesisManagement.Api.DTOs
{
    public class DefenseAssignmentFilter : BaseFilter
    {
        public string? TopicCode { get; set; }
        public string? CommitteeCode { get; set; }
        public string? AssignmentCode { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }
}
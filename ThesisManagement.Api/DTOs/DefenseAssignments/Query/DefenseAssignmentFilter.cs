namespace ThesisManagement.Api.DTOs.DefenseAssignments.Query
{
    public class DefenseAssignmentFilter : BaseFilter
    {
        public string? TopicCode { get; set; }
        public string? CommitteeCode { get; set; }
        public string? AssignmentCode { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }
}
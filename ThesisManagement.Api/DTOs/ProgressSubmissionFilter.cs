namespace ThesisManagement.Api.DTOs
{
    public class ProgressSubmissionFilter : BaseFilter
    {
        public string? SubmissionCode { get; set; }
        public string? MilestoneCode { get; set; }
        public string? StudentUserCode { get; set; }
        public string? StudentProfileCode { get; set; }
        public string? LecturerState { get; set; }
        public DateTime? SubmittedFrom { get; set; }
        public DateTime? SubmittedTo { get; set; }
    }
}
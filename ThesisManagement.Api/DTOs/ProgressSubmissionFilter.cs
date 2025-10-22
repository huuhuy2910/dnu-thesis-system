namespace ThesisManagement.Api.DTOs
{
    public class ProgressSubmissionFilter : BaseFilter
    {
        public string? SubmissionCode { get; set; }
    public int? MilestoneID { get; set; }
        public string? MilestoneCode { get; set; }
    public int? StudentUserID { get; set; }
        public string? StudentUserCode { get; set; }
    public int? StudentProfileID { get; set; }
        public string? StudentProfileCode { get; set; }
        public int? LecturerProfileID { get; set; }
        public string? LecturerCode { get; set; }
        public string? LecturerState { get; set; }
        public DateTime? SubmittedFrom { get; set; }
        public DateTime? SubmittedTo { get; set; }
        public int? MinAttemptNumber { get; set; }
        public int? MaxAttemptNumber { get; set; }
        public string? MimeType { get; set; }
    }
}
namespace ThesisManagement.Api.DTOs
{
    public class TopicLecturerFilter : BaseFilter
    {
        public string? TopicCode { get; set; }
        public string? LecturerCode { get; set; }
        public bool? IsPrimary { get; set; }
    }
}
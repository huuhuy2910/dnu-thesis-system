namespace ThesisManagement.Api.DTOs.TopicLecturers.Query
{
    public class TopicLecturerFilter : BaseFilter
    {
        public string? TopicCode { get; set; }
        public string? LecturerCode { get; set; }
        public bool? IsPrimary { get; set; }
    }
}
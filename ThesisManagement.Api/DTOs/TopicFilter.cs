namespace ThesisManagement.Api.DTOs
{
    public class TopicFilter : BaseFilter
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? ProposerStudentCode { get; set; }
        public string? TopicCode { get; set; }
        public string? Tags { get; set; }
        public IEnumerable<string>? TagCodes { get; set; }
        public string? Type { get; set; }
        public string? Status { get; set; }
        public string? ProposerUserCode { get; set; }
        public string? SupervisorUserCode { get; set; }
        public string? SupervisorLecturerCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? CatalogTopicCode { get; set; }
    }
}
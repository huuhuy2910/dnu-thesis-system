namespace ThesisManagement.Api.DTOs.Tags.Query
{
    public class TagFilter : BaseFilter
    {
        public string? TagCode { get; set; }
        public string? TagName { get; set; }
        public string? Description { get; set; }
    }
}
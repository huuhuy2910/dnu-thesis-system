namespace ThesisManagement.Api.DTOs.CatalogTopics.Query
{
    public class CatalogTopicFilter : BaseFilter
    {
        public string? Title { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? Tags { get; set; }
        public string? OwnerLecturerCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? AssignedStatus { get; set; }
    }
}
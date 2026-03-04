namespace ThesisManagement.Api.DTOs.TopicTags.Query
{
    public class TopicTagFilter : BaseFilter
    {
        public int? TagID { get; set; }
        public string? TagCode { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? TopicCode { get; set; }
    }
}
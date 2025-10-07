using System;

namespace ThesisManagement.Api.Models
{
    public class TopicTag
    {
        public int TopicTagID { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? TopicCode { get; set; }
        public int TagID { get; set; }
        public string? TagCode { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties - Topic removed to prevent shadow properties
        public CatalogTopic? CatalogTopic { get; set; }
        // public Topic? Topic { get; set; }
        public Tag? Tag { get; set; }
    }
}
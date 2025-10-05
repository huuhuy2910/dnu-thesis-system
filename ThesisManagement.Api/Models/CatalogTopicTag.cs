using System;

namespace ThesisManagement.Api.Models
{
    public class CatalogTopicTag
    {
        public int CatalogTopicID { get; set; }
        public int TagID { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? TagCode { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public CatalogTopic? CatalogTopic { get; set; }
        public Tag? Tag { get; set; }
    }
}
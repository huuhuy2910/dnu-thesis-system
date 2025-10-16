using System;

namespace ThesisManagement.Api.DTOs
{
    public class CatalogTopicTagFilter : BaseFilter
    {
        public int? CatalogTopicID { get; set; }
        public int? TagID { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? TagCode { get; set; }
    }
}

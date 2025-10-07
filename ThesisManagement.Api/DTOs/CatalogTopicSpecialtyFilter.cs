using System;

namespace ThesisManagement.Api.DTOs
{
    public class CatalogTopicSpecialtyFilter : PaginationParams
    {
        public int? CatalogTopicID { get; set; }
        public int? SpecialtyID { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? SpecialtyCode { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
    }
}

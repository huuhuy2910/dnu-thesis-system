using System;

namespace ThesisManagement.Api.Models
{
    public class CatalogTopicSpecialty
    {
        public int CatalogTopicID { get; set; }
        public int SpecialtyID { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? SpecialtyCode { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public CatalogTopic? CatalogTopic { get; set; }
        public Specialty? Specialty { get; set; }
    }
}
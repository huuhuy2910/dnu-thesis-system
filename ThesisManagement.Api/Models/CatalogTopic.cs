using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class CatalogTopic
    {
        public int CatalogTopicID { get; set; }
        public string CatalogTopicCode { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Summary { get; set; }
        public int? DepartmentID { get; set; } // Keep for internal use
        public string? DepartmentCode { get; set; } // New: reference by code
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        // Navigation properties
        public Department? Department { get; set; }
        public ICollection<CatalogTopicSpecialty>? CatalogTopicSpecialties { get; set; }
        public ICollection<CatalogTopicTag>? CatalogTopicTags { get; set; }
        public ICollection<Topic>? Topics { get; set; }
    }
}

using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Specialty
    {
        public int SpecialtyID { get; set; }
        public string SpecialtyCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        // Navigation properties
        public ICollection<LecturerSpecialty>? LecturerSpecialties { get; set; }
        public ICollection<CatalogTopicSpecialty>? CatalogTopicSpecialties { get; set; }
    }
}
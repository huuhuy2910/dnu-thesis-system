using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Department
    {
        public int DepartmentID { get; set; }
        public string DepartmentCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        // Navigation property removed to prevent EF shadow properties
        // public ICollection<StudentProfile>? StudentProfiles { get; set; }
        public ICollection<LecturerProfile>? LecturerProfiles { get; set; }
        public ICollection<CatalogTopic>? CatalogTopics { get; set; }
        public ICollection<Topic>? Topics { get; set; }
    }
}

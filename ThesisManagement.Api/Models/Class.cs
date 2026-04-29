using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Class
    {
        public int ClassID { get; set; }
        public string ClassCode { get; set; } = null!;
        public string ClassName { get; set; } = null!;
        public int DepartmentID { get; set; }
        public string? DepartmentCode { get; set; }
        public int? CohortId { get; set; }
        public string? CohortCode { get; set; }
        public string? CohortName { get; set; }
        public int? EnrollmentYear { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastUpdated { get; set; }

        public Department? Department { get; set; }
        public Cohort? Cohort { get; set; }
        public ICollection<StudentProfile>? StudentProfiles { get; set; }
    }
}

using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class LecturerProfile
    {
        public int LecturerProfileID { get; set; }
        public string LecturerCode { get; set; } = null!;
        public int UserID { get; set; } // Keep for internal use
        public string? UserCode { get; set; } // New: reference by code
        public int? DepartmentID { get; set; } // Keep for internal use
        public string? DepartmentCode { get; set; } // New: reference by code
        public string? Degree { get; set; }
        public string? Specialties { get; set; } // Keep for backward compatibility
        public int? GuideQuota { get; set; }
        public int? DefenseQuota { get; set; }
        public int CurrentGuidingCount { get; set; } = 0; // New: current number of guiding topics
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        // Navigation properties
        public User? User { get; set; }
        public Department? Department { get; set; }
        public ICollection<LecturerSpecialty>? LecturerSpecialties { get; set; }
        public ICollection<TopicLecturer>? TopicLecturers { get; set; }
    }
}

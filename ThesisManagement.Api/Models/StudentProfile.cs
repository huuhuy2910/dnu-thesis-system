using System;

namespace ThesisManagement.Api.Models
{
    public class StudentProfile
    {
        public int StudentProfileID { get; set; }
        public string StudentCode { get; set; } = null!;
        public int UserID { get; set; } // Keep for internal use
        public string? UserCode { get; set; } // New: reference by code
        public int? DepartmentID { get; set; } // Keep for internal use
        public string? DepartmentCode { get; set; } // New: reference by code
        public string? ClassCode { get; set; }
        public string? FacultyCode { get; set; }
        public string? StudentImage { get; set; }
        public decimal? GPA { get; set; }
        public string? AcademicStanding { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
        public string? StudentEmail { get; set; }
        public string? Address { get; set; }
        public int? EnrollmentYear { get; set; }
        public string? Status { get; set; }
        public int? GraduationYear { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public User? User { get; set; }
        public Department? Department { get; set; }
        // Navigation collections removed to avoid EF creating shadow properties
        // public ICollection<Topic>? ProposedTopics { get; set; }
        // public ICollection<ProgressSubmission>? ProgressSubmissions { get; set; }
    }
}

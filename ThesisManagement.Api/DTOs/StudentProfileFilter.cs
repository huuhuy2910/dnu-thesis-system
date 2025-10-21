using System;

namespace ThesisManagement.Api.DTOs
{
    public class StudentProfileFilter : BaseFilter
    {
        // Support filtering by multiple student codes at once (e.g., ?studentCodes=STU001&studentCodes=STU002 or ?studentCodes=STU001,STU002)
        public IEnumerable<string>? StudentCodes { get; set; }

        public string? UserCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? StudentCode { get; set; }
        public string? ClassCode { get; set; }
        public string? FacultyCode { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirthFrom { get; set; }
        public DateTime? DateOfBirthTo { get; set; }
        public string? PhoneNumber { get; set; }
        public string? StudentEmail { get; set; }
        public string? Address { get; set; }
        public int? MinEnrollmentYear { get; set; }
        public int? MaxEnrollmentYear { get; set; }
        public string? Status { get; set; }
        public int? MinGraduationYear { get; set; }
        public int? MaxGraduationYear { get; set; }
        public decimal? MinGPA { get; set; }
        public decimal? MaxGPA { get; set; }
        public string? AcademicStanding { get; set; }
    }
}
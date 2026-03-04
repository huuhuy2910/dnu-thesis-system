using System;

namespace ThesisManagement.Api.DTOs.StudentProfiles.Command
{
    public record StudentProfileCreateDto(
        string UserCode,
        string? DepartmentCode,
        string? ClassCode,
        string? FacultyCode,
        string? StudentImage,
        decimal? GPA,
        string? AcademicStanding,
        string? Gender,
        DateTime? DateOfBirth,
        string? PhoneNumber,
        string? StudentEmail,
        string? Address,
        int? EnrollmentYear,
        string? Status,
        int? GraduationYear,
        string? Notes,
        string? FullName);

    public record StudentProfileUpdateDto(
        string? StudentCode,
        string? UserCode,
        string? DepartmentCode,
        string? ClassCode,
        string? FacultyCode,
        decimal? GPA,
        string? AcademicStanding,
        string? Gender,
        DateTime? DateOfBirth,
        string? PhoneNumber,
        string? StudentEmail,
        string? Address,
        int? EnrollmentYear,
        string? Status,
        int? GraduationYear,
        string? Notes,
        string? FullName);
}
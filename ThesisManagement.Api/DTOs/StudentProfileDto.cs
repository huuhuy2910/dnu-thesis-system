using System;

namespace ThesisManagement.Api.DTOs
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
        string? Notes);

    public record StudentProfileUpdateDto(
        string? StudentCode,
        string? UserCode,
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
        string? Notes);

    public record StudentProfileReadDto(
        int StudentProfileID,
        string StudentCode,
        string? UserCode,
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
    DateTime? CreatedAt,
    DateTime? LastUpdated);
}

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
        string? Notes,
        string? FullName);

    public record StudentProfileUpdateDto(
        string? StudentCode,
        string? UserCode,
        string? DepartmentCode,
        string? ClassCode,
        string? FacultyCode,
        // StudentImage không được update qua PUT, sử dụng POST /upload-avatar thay thế
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
        string? FullName,
        DateTime? CreatedAt,
        DateTime? LastUpdated);
}

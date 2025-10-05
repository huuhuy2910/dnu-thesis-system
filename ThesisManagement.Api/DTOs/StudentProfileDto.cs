using System;

namespace ThesisManagement.Api.DTOs
{
    public record StudentProfileCreateDto(string UserCode, string? DepartmentCode, string? ClassCode, string? FacultyCode, string? StudentImage, decimal? GPA, string? AcademicStanding);
    public record StudentProfileUpdateDto(string? DepartmentCode, string? ClassCode, string? FacultyCode, string? StudentImage, decimal? GPA, string? AcademicStanding);
    public record StudentProfileReadDto(int StudentProfileID, string StudentCode, string? UserCode, string? DepartmentCode, string? ClassCode, string? FacultyCode, string? StudentImage, decimal? GPA, string? AcademicStanding, DateTime CreatedAt, DateTime LastUpdated);
}

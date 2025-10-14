using System;

namespace ThesisManagement.Api.DTOs
{
    public record LecturerProfileCreateDto(
        string UserCode, 
        string? DepartmentCode, 
        string? Degree, 
        int? GuideQuota, 
        int? DefenseQuota, 
        int CurrentGuidingCount,
        string? Gender,
        DateTime? DateOfBirth,
        string? Email,
        string? PhoneNumber,
        string? ProfileImage,
        string? Address,
        string? Notes,
        string? FullName);

    public record LecturerProfileUpdateDto(
        string? DepartmentCode, 
        string? Degree, 
        int? GuideQuota, 
        int? DefenseQuota, 
        int? CurrentGuidingCount,
        string? Gender,
        DateTime? DateOfBirth,
        string? Email,
        string? PhoneNumber,
        string? ProfileImage,
        string? Address,
        string? Notes,
        string? FullName);

    public record LecturerProfileReadDto(
        int LecturerProfileID, 
        string LecturerCode, 
        string? UserCode, 
        string? DepartmentCode, 
        string? Degree, 
        int GuideQuota, 
        int DefenseQuota, 
        int CurrentGuidingCount,
        string? Gender,
        DateTime? DateOfBirth,
        string? Email,
        string? PhoneNumber,
        string? ProfileImage,
        string? Address,
        string? Notes,
        string? FullName,
        DateTime? CreatedAt, 
        DateTime? LastUpdated);
}

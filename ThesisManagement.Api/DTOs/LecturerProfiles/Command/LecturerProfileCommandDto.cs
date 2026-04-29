using System;

namespace ThesisManagement.Api.DTOs.LecturerProfiles.Command
{
    public record LecturerProfileCreateDto(
        string UserCode,
        string? DepartmentCode,
        string? Degree,
        string? Organization,
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
        string? Organization,
        int? GuideQuota,
        int? DefenseQuota,
        int? CurrentGuidingCount,
        string? Gender,
        DateTime? DateOfBirth,
        string? Email,
        string? PhoneNumber,
        string? Address,
        string? Notes,
        string? FullName);
}
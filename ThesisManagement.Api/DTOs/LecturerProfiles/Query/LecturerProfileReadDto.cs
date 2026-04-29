using System;

namespace ThesisManagement.Api.DTOs.LecturerProfiles.Query
{
    public record LecturerProfileReadDto(
        int LecturerProfileID,
        string LecturerCode,
        string? UserCode,
        string? DepartmentCode,
        string? Degree,
        string? Organization,
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
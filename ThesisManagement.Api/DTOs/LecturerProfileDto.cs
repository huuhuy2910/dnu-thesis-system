using System;

namespace ThesisManagement.Api.DTOs
{
    public record LecturerProfileCreateDto(string UserCode, string? DepartmentCode, string? Degree, int? GuideQuota, int? DefenseQuota, int CurrentGuidingCount);
    public record LecturerProfileUpdateDto(string? DepartmentCode, string? Degree, int? GuideQuota, int? DefenseQuota, int? CurrentGuidingCount);
    public record LecturerProfileReadDto(int LecturerProfileID, string LecturerCode, string? UserCode, string? DepartmentCode, string? Degree, int GuideQuota, int DefenseQuota, int CurrentGuidingCount, DateTime? CreatedAt, DateTime? LastUpdated);
}

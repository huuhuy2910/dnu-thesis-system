using System;

namespace ThesisManagement.Api.DTOs.DefenseTermLecturers.Command
{
    public record DefenseTermLecturerCreateDto(
        int DefenseTermId,
        int? LecturerProfileID,
        string? LecturerCode,
        string? UserCode,
        string? Role,
        bool IsPrimary,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record DefenseTermLecturerUpdateDto(
        int? DefenseTermId,
        int? LecturerProfileID,
        string? LecturerCode,
        string? UserCode,
        string? Role,
        bool? IsPrimary,
        DateTime? CreatedAt,
        DateTime? LastUpdated);
}
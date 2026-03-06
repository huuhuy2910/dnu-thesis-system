using System;

namespace ThesisManagement.Api.DTOs.LecturerTags.Command
{
    public record LecturerTagCreateDto(
        int LecturerProfileID,
        string? LecturerCode,
        int TagID,
        string? TagCode,
        DateTime? AssignedAt,
        int? AssignedByUserID,
        string? AssignedByUserCode
    );

    public record LecturerTagUpdateDto(
        int? LecturerProfileID,
        string? LecturerCode,
        int? TagID,
        string? TagCode,
        DateTime? AssignedAt,
        int? AssignedByUserID,
        string? AssignedByUserCode
    );
}
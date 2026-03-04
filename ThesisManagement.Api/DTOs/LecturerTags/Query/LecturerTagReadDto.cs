using System;

namespace ThesisManagement.Api.DTOs.LecturerTags.Query
{
    public record LecturerTagReadDto(
        int LecturerTagID,
        int LecturerProfileID,
        string? LecturerCode,
        int TagID,
        string? TagCode,
        DateTime? AssignedAt,
        int? AssignedByUserID,
        string? AssignedByUserCode
    );
}
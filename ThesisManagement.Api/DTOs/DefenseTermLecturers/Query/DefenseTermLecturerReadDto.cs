using System;

namespace ThesisManagement.Api.DTOs.DefenseTermLecturers.Query
{
    public record DefenseTermLecturerReadDto(
        int DefenseTermLecturerID,
        int DefenseTermId,
        int LecturerProfileID,
        string LecturerCode,
        string LecturerName,
        string UserCode,
        string? Role,
        bool IsPrimary,
        DateTime CreatedAt,
        DateTime LastUpdated);
}
using System;

namespace ThesisManagement.Api.DTOs.TopicLecturers.Command
{
    public record TopicLecturerCreateDto(
        int? TopicID,
        string? TopicCode,
        int? LecturerProfileID,
        string? LecturerCode,
        bool IsPrimary = false,
        DateTime CreatedAt = default);

    public record TopicLecturerUpdateDto(
        int? TopicID,
        string? TopicCode,
        int? LecturerProfileID,
        string? LecturerCode,
        bool? IsPrimary,
        DateTime? CreatedAt);
}
using System;

namespace ThesisManagement.Api.DTOs
{
    public record TopicLecturerCreateDto(string TopicCode, string LecturerCode, bool IsPrimary = false);
    public record TopicLecturerUpdateDto(bool? IsPrimary);
    public record TopicLecturerReadDto(int TopicID, int LecturerProfileID, string? TopicCode, string? LecturerCode, bool IsPrimary, DateTime CreatedAt);
}
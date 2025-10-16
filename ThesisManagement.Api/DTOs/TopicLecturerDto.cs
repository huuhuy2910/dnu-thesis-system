using System;

namespace ThesisManagement.Api.DTOs
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

    // Changed to a class with a parameterless constructor so AutoMapper can construct and populate it.
    public class TopicLecturerReadDto
    {
        public TopicLecturerReadDto() { }

        public int TopicID { get; set; }
        public int LecturerProfileID { get; set; }
        public string? TopicCode { get; set; }
        public string? LecturerCode { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
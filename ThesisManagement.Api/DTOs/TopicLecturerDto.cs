using System;

namespace ThesisManagement.Api.DTOs
{
    public record TopicLecturerCreateDto(string TopicCode, string LecturerCode, bool IsPrimary = false);
    public record TopicLecturerUpdateDto(bool? IsPrimary);

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
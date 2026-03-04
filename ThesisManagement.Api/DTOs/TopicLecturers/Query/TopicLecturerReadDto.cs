using System;

namespace ThesisManagement.Api.DTOs.TopicLecturers.Query
{
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
using System;

namespace ThesisManagement.Api.Models
{
    public class TopicLecturer
    {
        public int TopicID { get; set; }
        public string? TopicCode { get; set; } // Code-based reference
        public int LecturerProfileID { get; set; }
        public bool IsPrimary { get; set; } = false;
        public DateTime CreatedAt { get; set; }

        // Navigation properties - Topic removed to prevent shadow properties
        // public Topic? Topic { get; set; }
        public LecturerProfile? LecturerProfile { get; set; }
    }
}
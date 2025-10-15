using System;

namespace ThesisManagement.Api.Models
{
    public class LecturerTag
    {
        public int LecturerProfileID { get; set; }
        public int TagID { get; set; }
        public string? LecturerCode { get; set; }
        public string? TagCode { get; set; }
        public DateTime CreatedAt { get; set; }

        public LecturerProfile? LecturerProfile { get; set; }
        public Tag? Tag { get; set; }
    }
}

using System;

namespace ThesisManagement.Api.Models
{
    public class LecturerTag
    {
        public int LecturerTagID { get; set; }
        public int LecturerProfileID { get; set; }
        public string? LecturerCode { get; set; }
        public int TagID { get; set; }
        public string? TagCode { get; set; }
        public DateTime? AssignedAt { get; set; }
        public int? AssignedByUserID { get; set; }
        public string? AssignedByUserCode { get; set; }

        // Navigation properties
        public LecturerProfile? LecturerProfile { get; set; }
        public Tag? Tag { get; set; }
        public User? AssignedByUser { get; set; }
    }                                                                                                                                                         
}

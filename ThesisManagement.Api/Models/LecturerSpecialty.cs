using System;

namespace ThesisManagement.Api.Models
{
    public class LecturerSpecialty
    {
        public int LecturerProfileID { get; set; }
        public int SpecialtyID { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public LecturerProfile? LecturerProfile { get; set; }
        public Specialty? Specialty { get; set; }
    }
}
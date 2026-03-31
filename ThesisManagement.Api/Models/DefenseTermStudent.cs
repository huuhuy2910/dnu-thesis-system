using System;

namespace ThesisManagement.Api.Models
{
    public class DefenseTermStudent
    {
        public int DefenseTermStudentID { get; set; }
        public int DefenseTermId { get; set; }
        public int StudentProfileID { get; set; }
        public string StudentCode { get; set; } = null!;
        public string UserCode { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public DefenseTerm? DefenseTerm { get; set; }
        public StudentProfile? StudentProfile { get; set; }
        public User? StudentUser { get; set; }
    }
}

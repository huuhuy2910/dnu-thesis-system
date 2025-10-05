using System;

namespace ThesisManagement.Api.Models
{
    public class DefenseScore
    {
        public int ScoreID { get; set; }
        public string ScoreCode { get; set; } = null!;
        public int AssignmentID { get; set; } // Internal reference
        public string? AssignmentCode { get; set; } // Code-based reference
        public int? MemberLecturerProfileID { get; set; } // Internal reference
        public string? MemberLecturerCode { get; set; } // Code-based reference
        public int? MemberLecturerUserID { get; set; } // Internal reference
        public string? MemberLecturerUserCode { get; set; } // Code-based reference
        public decimal Score { get; set; }
        public string? Comment { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastUpdated { get; set; }

        // Navigation properties removed to prevent EF shadow properties
        // public DefenseAssignment? Assignment { get; set; }
        public User? MemberLecturerUser { get; set; }
        // public LecturerProfile? MemberLecturerProfile { get; set; }
    }
}

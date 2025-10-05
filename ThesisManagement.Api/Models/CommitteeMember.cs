using System;

namespace ThesisManagement.Api.Models
{
    public class CommitteeMember
    {
        public int CommitteeMemberID { get; set; } // Primary key
        public int? CommitteeID { get; set; } // Internal reference
        public string? CommitteeCode { get; set; } // Code-based reference
        public int? MemberLecturerProfileID { get; set; } // Internal reference
        public string? MemberLecturerCode { get; set; } // Code-based reference
        public int? MemberUserID { get; set; } // Internal reference
        public string? MemberUserCode { get; set; } // Code-based reference
        public string? Role { get; set; } // Role description
        public bool? IsChair { get; set; } // Chairman flag
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastUpdated { get; set; }

        // Navigation properties
        public Committee? Committee { get; set; }
        public User? MemberUser { get; set; }
        public LecturerProfile? MemberLecturerProfile { get; set; }
    }
}

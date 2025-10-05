using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class User
    {
        public int UserID { get; set; }
        public string UserCode { get; set; } = null!; // UserCode is now the username
        public string PasswordHash { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Role { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public StudentProfile? StudentProfile { get; set; }
        public LecturerProfile? LecturerProfile { get; set; }
    }
}

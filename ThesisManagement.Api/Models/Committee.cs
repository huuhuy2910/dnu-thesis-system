using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Committee
    {
        public int CommitteeID { get; set; }
        public string CommitteeCode { get; set; } = null!;
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public ICollection<CommitteeMember>? Members { get; set; }
        // Navigation property removed to prevent EF shadow properties
        // public ICollection<DefenseAssignment>? DefenseAssignments { get; set; }
    }
}

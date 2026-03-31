using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class DefenseTerm
    {
        public int DefenseTermId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? ConfigJson { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public ICollection<DefenseTermStudent>? DefenseTermStudents { get; set; }
        public ICollection<DefenseTermLecturer>? DefenseTermLecturers { get; set; }
    }
}

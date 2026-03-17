using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("DEFENSE_DOCUMENTS")]
    public class DefenseDocument
    {
        [Key]
        [Column("DOCUMENTID")]
        public int DocumentId { get; set; }

        [Column("ASSIGNMENTID")]
        public int AssignmentId { get; set; }

        [Column("DOCUMENTTYPE")]
        public string DocumentType { get; set; } = null!;

        [Column("FILEURL")]
        public string FileUrl { get; set; } = null!;

        [Column("GENERATEDAT")]
        public DateTime GeneratedAt { get; set; }

        public DefenseAssignment? Assignment { get; set; }
    }
}

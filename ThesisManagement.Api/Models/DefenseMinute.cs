using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("DEFENSE_MINUTES")]
    public class DefenseMinute
    {
        [Key]
        [Column("MINUTEID")]
        public int Id { get; set; }

        [Column("ASSIGNMENTID")]
        public int AssignmentId { get; set; }

        [Column("SECRETARY_ID")]
        public int SecretaryId { get; set; }

        [Column("SUMMARYCONTENT")]
        public string? SummaryContent { get; set; }

        [Column("REVIEWERCOMMENTS")]
        public string? ReviewerComments { get; set; }

        [Column("QNA_DETAILS")]
        public string? QnaDetails { get; set; }

        [Column("STRENGTHS")]
        public string? Strengths { get; set; }

        [Column("WEAKNESSES")]
        public string? Weaknesses { get; set; }

        [Column("RECOMMENDATIONS")]
        public string? Recommendations { get; set; }

        [Column("CREATEDAT")]
        public DateTime CreatedAt { get; set; }

        [Column("LASTUPDATED")]
        public DateTime LastUpdated { get; set; }

        public DefenseAssignment? Assignment { get; set; }
        public LecturerProfile? Secretary { get; set; }
    }
}

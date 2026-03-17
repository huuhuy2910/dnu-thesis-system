using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("EVALUATION_REVIEWS")]
    public class EvaluationReview
    {
        [Key]
        [Column("REVIEWID")]
        public int Id { get; set; }

        [Column("ASSIGNMENTID")]
        public int AssignmentId { get; set; }

        [Column("LECTURERPROFILEID")]
        public int LecturerId { get; set; }

        [Column("REVIEWTYPE")]
        public ReviewType ReviewType { get; set; }

        [Column("CRITERIA_1_TEXT")]
        public string? Criteria1Text { get; set; }

        [Column("CRITERIA_2_TEXT")]
        public string? Criteria2Text { get; set; }

        [Column("CRITERIA_3_TEXT")]
        public string? Criteria3Text { get; set; }

        [Column("CRITERIA_4_TEXT")]
        public string? Criteria4Text { get; set; }

        [Column("LIMITATIONS")]
        public string? Limitations { get; set; }

        [Column("SUGGESTIONS")]
        public string? Suggestions { get; set; }

        [Column("NUMERICSCORE")]
        public decimal? NumericScore { get; set; }

        [Column("TEXTSCORE")]
        public string? TextScore { get; set; }

        [Column("IS_APPROVED")]
        public bool IsApproved { get; set; }

        [Column("CREATEDAT")]
        public DateTime CreatedAt { get; set; }

        [Column("LASTUPDATED")]
        public DateTime LastUpdated { get; set; }

        public DefenseAssignment? Assignment { get; set; }
        public LecturerProfile? Lecturer { get; set; }
    }
}

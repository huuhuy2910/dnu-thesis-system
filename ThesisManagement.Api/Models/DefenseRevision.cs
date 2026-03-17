using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("DEFENSE_REVISIONS")]
    public class DefenseRevision
    {
        [Key]
        [Column("REVISIONID")]
        public int Id { get; set; }

        [Column("ASSIGNMENTID")]
        public int AssignmentId { get; set; }

        [Column("REVISEDCONTENT")]
        public string? RevisedContent { get; set; }

        [Column("REVISIONFILEURL")]
        public string? RevisionFileUrl { get; set; }

        [Column("IS_GVHD_APPROVED")]
        public bool IsGvhdApproved { get; set; }

        [Column("IS_UVTK_APPROVED")]
        public bool IsUvtkApproved { get; set; }

        [Column("IS_CT_APPROVED")]
        public bool IsCtApproved { get; set; }

        [Column("FINALSTATUS")]
        public RevisionFinalStatus FinalStatus { get; set; }

        [Column("CREATEDAT")]
        public DateTime CreatedAt { get; set; }

        [Column("LASTUPDATED")]
        public DateTime LastUpdated { get; set; }

        public DefenseAssignment? Assignment { get; set; }
    }
}

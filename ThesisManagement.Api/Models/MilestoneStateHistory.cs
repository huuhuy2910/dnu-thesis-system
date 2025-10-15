using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ThesisManagement.Api.Models
{
    [Table("MilestoneStateHistory")]
    public class MilestoneStateHistory
    {
        [Key]
        public int HistoryID { get; set; }

        public int MilestoneID { get; set; }

        [MaxLength(60)]
        public string MilestoneCode { get; set; } = string.Empty;

        [MaxLength(40)]
        public string TopicCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? OldState { get; set; }

        [MaxLength(50)]
        public string? NewState { get; set; }

        [MaxLength(40)]
        public string ChangedByUserCode { get; set; } = string.Empty;

        public int? ChangedByUserID { get; set; }

        public DateTime ChangedAt { get; set; }

        [MaxLength(500)]
        public string? Comment { get; set; }
    }
}
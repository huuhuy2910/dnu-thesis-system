using System;

namespace ThesisManagement.Api.Models
{
    public class TopicTitleHistory
    {
        public int HistoryId { get; set; }
        public string HistoryCode { get; set; } = null!;
        public int? TopicId { get; set; }
        public string TopicCode { get; set; } = null!;
        public int? RequestId { get; set; }
        public string? RequestCode { get; set; }
        public string PreviousTitle { get; set; } = null!;
        public string NewTitle { get; set; } = null!;
        public string ChangeType { get; set; } = null!;
        public string? ChangeReason { get; set; }
        public string? ApprovalComment { get; set; }
        public int ChangedByUserId { get; set; }
        public string ChangedByUserCode { get; set; } = null!;
        public string ChangedByRole { get; set; } = null!;
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByUserCode { get; set; }
        public string? ApprovedByRole { get; set; }
        public DateTime EffectiveAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public TopicRenameRequest? Request { get; set; }
        public User? ChangedByUser { get; set; }
        public User? ApprovedByUser { get; set; }
    }
}
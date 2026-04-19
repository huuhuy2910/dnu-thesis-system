using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class TopicRenameRequest
    {
        public int RequestId { get; set; }
        public string RequestCode { get; set; } = null!;
        public int? TopicId { get; set; }
        public string TopicCode { get; set; } = null!;
        public string OldTitle { get; set; } = null!;
        public string NewTitle { get; set; } = null!;
        public string? Reason { get; set; }
        public string Status { get; set; } = null!;
        public int RequestedByUserId { get; set; }
        public string RequestedByUserCode { get; set; } = null!;
        public string RequestedByRole { get; set; } = null!;
        public int? ReviewedByUserId { get; set; }
        public string? ReviewedByUserCode { get; set; }
        public string? ReviewedByRole { get; set; }
        public string? ReviewComment { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime? AppliedAt { get; set; }
        public string? GeneratedFileUrl { get; set; }
        public string? GeneratedFileName { get; set; }
        public long? GeneratedFileSize { get; set; }
        public string? GeneratedFileHash { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Topic? Topic { get; set; }
        public User? RequestedByUser { get; set; }
        public User? ReviewedByUser { get; set; }
        public ICollection<TopicRenameRequestFile>? Files { get; set; }
        public ICollection<TopicTitleHistory>? TitleHistories { get; set; }
    }
}
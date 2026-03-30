using System;

namespace ThesisManagement.Api.Models
{
    public class NotificationOutbox
    {
        public int OutboxID { get; set; }
        public string EventType { get; set; } = null!;
        public string PayloadJson { get; set; } = null!;
        public string OutboxStatus { get; set; } = "PENDING";
        public int RetryCount { get; set; } = 0;
        public DateTime? NextRetryAt { get; set; }
        public string? LastError { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}

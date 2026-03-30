using System;

namespace ThesisManagement.Api.Models
{
    public enum IdempotencyRecordStatus
    {
        Processing = 0,
        Completed = 1,
        Failed = 2
    }

    public class IdempotencyRecord
    {
        public int IdempotencyRecordID { get; set; }
        public string Action { get; set; } = null!;
        public int PeriodID { get; set; }
        public string RequestKey { get; set; } = null!;
        public string RequestHash { get; set; } = null!;
        public string? ResponsePayload { get; set; }
        public int? ResponseStatusCode { get; set; }
        public bool? ResponseSuccess { get; set; }
        public IdempotencyRecordStatus RecordStatus { get; set; } = IdempotencyRecordStatus.Processing;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}

using System;

namespace ThesisManagement.Api.Models
{
    public class TopicWorkflowAudit
    {
        public long AuditID { get; set; }
        public string AuditCode { get; set; } = null!;

        public string ModuleName { get; set; } = "TOPIC_WORKFLOW";
        public string WorkflowName { get; set; } = "TOPIC_REVIEW_AND_RESUBMIT";
        public string ActionType { get; set; } = null!;
        public string? DecisionAction { get; set; }

        public int? TopicID { get; set; }
        public string? TopicCode { get; set; }
        public string? EntityName { get; set; }
        public string? EntityID { get; set; }
        public string? EntityCode { get; set; }

        public string? OldStatus { get; set; }
        public string? NewStatus { get; set; }
        public string? StatusCode { get; set; }

        public int? ResubmitCountBefore { get; set; }
        public int? ResubmitCountAfter { get; set; }

        public string? CommentText { get; set; }
        public string? ErrorMessage { get; set; }
        public int IsSuccess { get; set; } = 1;

        public string? RequestPayload { get; set; }
        public string? ResponsePayload { get; set; }

        public string? ChangedFields { get; set; }
        public string? TagsBefore { get; set; }
        public string? TagsAfter { get; set; }
        public string? MilestoneBefore { get; set; }
        public string? MilestoneAfter { get; set; }

        public int? ActorUserID { get; set; }
        public string? ActorUserCode { get; set; }
        public string? ActorRole { get; set; }

        public int? ReviewerUserID { get; set; }
        public string? ReviewerUserCode { get; set; }

        public string? CorrelationID { get; set; }
        public string? IdempotencyKey { get; set; }
        public string? RequestID { get; set; }

        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? DeviceInfo { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}

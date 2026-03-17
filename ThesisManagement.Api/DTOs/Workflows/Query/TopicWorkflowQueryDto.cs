using System;
using System.Collections.Generic;
using ThesisManagement.Api.DTOs.Topics.Query;

namespace ThesisManagement.Api.DTOs.Workflows.Query
{
    public record TopicWorkflowResultDto(
        TopicReadDto Topic,
        IEnumerable<string> TagCodes,
        string MilestoneState,
        string StatusCode,
        bool IsNewTopic,
        string Message
    );

    public record TopicWorkflowDetailDto(
        TopicReadDto Topic,
        IEnumerable<string> TagCodes,
        string? MilestoneState,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? CompletedAt1,
        DateTime? CompletedAt2,
        DateTime? CompletedAt3,
        DateTime? CompletedAt4,
        DateTime? CompletedAt5,
        int ResubmitCount,
        string? LatestLecturerComment
    );

    public record TopicWorkflowAuditReadDto(
        long AuditID,
        string AuditCode,
        string ActionType,
        string? DecisionAction,
        int? TopicID,
        string? TopicCode,
        string? OldStatus,
        string? NewStatus,
        string? StatusCode,
        int? ResubmitCountBefore,
        int? ResubmitCountAfter,
        string? CommentText,
        int IsSuccess,
        string? ErrorMessage,
        string? ActorUserCode,
        string? ActorRole,
        string? CorrelationID,
        DateTime CreatedAt
    );

    public record TopicWorkflowAuditListDto(
        IEnumerable<TopicWorkflowAuditReadDto> Items,
        int TotalCount
    );

    public record TopicWorkflowTimelineItemDto(
        long AuditID,
        string AuditCode,
        string ActionType,
        string? DecisionAction,
        string? FromStatus,
        string? ToStatus,
        string? StatusCode,
        string? CommentText,
        string? ActorUserCode,
        int IsSuccess,
        DateTime CreatedAt
    );

    public record TopicWorkflowTimelineDto(
        int TopicID,
        string TopicCode,
        IEnumerable<TopicWorkflowTimelineItemDto> Events
    );

    public record TopicWorkflowRollbackResultDto(
        int TopicsDeleted,
        int TopicTagsDeleted,
        int TopicLecturersDeleted,
        int ProgressMilestonesDeleted,
        int ConversationMembersDeleted,
        int DirectConversationsDeleted,
        string Message
    );
}

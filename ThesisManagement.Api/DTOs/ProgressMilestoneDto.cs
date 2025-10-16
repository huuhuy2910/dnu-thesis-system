using System;

namespace ThesisManagement.Api.DTOs
{
    public record ProgressMilestoneCreateDto(
        string? MilestoneCode,
        string TopicCode,
        int? TopicID,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt1,
        DateTime? CompletedAt2,
        DateTime? CompletedAt3,
        DateTime? CompletedAt4,
        DateTime? CompletedAt5,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record ProgressMilestoneUpdateDto(
        string? MilestoneCode,
        int? TopicID,
        string? TopicCode,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt1,
        DateTime? CompletedAt2,
        DateTime? CompletedAt3,
        DateTime? CompletedAt4,
        DateTime? CompletedAt5,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record ProgressMilestoneReadDto(
        int MilestoneID,
        string MilestoneCode,
        int? TopicID,
        string? TopicCode,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt1,
        DateTime? CompletedAt2,
        DateTime? CompletedAt3,
        DateTime? CompletedAt4,
        DateTime? CompletedAt5,
        DateTime CreatedAt,
        DateTime LastUpdated);
}

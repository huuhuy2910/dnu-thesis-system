using System;

namespace ThesisManagement.Api.DTOs
{
    public record ProgressMilestoneCreateDto(
        string TopicCode,
        int? TopicID,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt);

    public record ProgressMilestoneUpdateDto(
        int? TopicID,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt);

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
        DateTime? CompletedAt,
        DateTime CreatedAt,
        DateTime LastUpdated);
}

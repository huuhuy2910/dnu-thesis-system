using System;

namespace ThesisManagement.Api.DTOs
{
    public record ProgressMilestoneCreateDto(string TopicCode, string Type, DateTime? Deadline, string? Note);
    public record ProgressMilestoneUpdateDto(string? Type, DateTime? Deadline, string? State, string? Note);
    public record ProgressMilestoneReadDto(int MilestoneID, string MilestoneCode, string? TopicCode, string Type, DateTime? Deadline, string State, string? Note, DateTime CreatedAt, DateTime LastUpdated);
}

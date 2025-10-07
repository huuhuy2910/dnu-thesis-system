using System;

namespace ThesisManagement.Api.DTOs
{
    public record DefenseAssignmentCreateDto(string TopicCode, string CommitteeCode, DateTime? ScheduledAt);
    public record DefenseAssignmentUpdateDto(string? CommitteeCode, DateTime? ScheduledAt);
    public record DefenseAssignmentReadDto(int AssignmentID, string AssignmentCode, string? TopicCode, string? CommitteeCode, DateTime? ScheduledAt, DateTime CreatedAt, DateTime LastUpdated);
}

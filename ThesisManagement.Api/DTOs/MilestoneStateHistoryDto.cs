using System;

namespace ThesisManagement.Api.DTOs
{
    public record MilestoneStateHistoryCreateDto(
        int MilestoneID,
        string? MilestoneCode,
        string? TopicCode,
        string? OldState,
        string NewState,
        string? ChangedByUserCode,
        int? ChangedByUserID,
        DateTime? ChangedAt,
        string? Comment);

    public record MilestoneStateHistoryUpdateDto(
        string? OldState,
        string? NewState,
        string? TopicCode,
        string? ChangedByUserCode,
        int? ChangedByUserID,
        DateTime? ChangedAt,
        string? Comment);

    public record MilestoneStateHistoryReadDto(
        int HistoryID,
        int MilestoneID,
        string? MilestoneCode,
        string? TopicCode,
        string? OldState,
        string NewState,
        string? ChangedByUserCode,
        int? ChangedByUserID,
        DateTime ChangedAt,
        string? Comment);
}

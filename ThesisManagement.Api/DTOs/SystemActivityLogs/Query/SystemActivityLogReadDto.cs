using System;

namespace ThesisManagement.Api.DTOs.SystemActivityLogs.Query
{
    public record SystemActivityLogReadDto(
        int LogID,
        string? EntityName,
        string? EntityID,
        string ActionType,
        string? ActionDescription,
        string? OldValue,
        string? NewValue,
        int? UserID,
        string? UserCode,
        string? UserRole,
        string? IPAddress,
        string? DeviceInfo,
        string? Module,
        DateTime PerformedAt,
        string? Status,
        string? RelatedRecordCode,
        string? Comment
    );
}
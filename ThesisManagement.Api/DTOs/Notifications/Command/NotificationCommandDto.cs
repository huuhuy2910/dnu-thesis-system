using System.Collections.Generic;

namespace ThesisManagement.Api.DTOs.Notifications.Command
{
    public record CreateNotificationDto(
        string NotifCategory,
        string NotifTitle,
        string NotifBody,
        string? NotifPriority,
        string? ActionType,
        string? ActionUrl,
        string? ImageUrl,
        string? RelatedEntityName,
        string? RelatedEntityCode,
        int? RelatedEntityID,
        bool IsGlobal,
        List<string>? TargetUserCodes,
        string? NotifChannel = "IN_APP");

    public record MarkReadDto(
        int RecipientID);

    public record MarkReadAllDto(
        string? NotifCategory);

    public record UpdateNotificationPreferenceDto(
        bool InAppEnabled,
        bool EmailEnabled,
        bool PushEnabled,
        string DigestMode,
        string? QuietFrom,
        string? QuietTo);
}

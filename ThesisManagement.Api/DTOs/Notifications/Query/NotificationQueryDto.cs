using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.DTOs.Notifications.Query
{
    public record NotificationReadDto(
        int NotificationID,
        string NotificationCode,
        string NotifChannel,
        string NotifCategory,
        string NotifTitle,
        string NotifBody,
        string NotifPriority,
        string? ActionType,
        string? ActionUrl,
        string? ImageUrl,
        string? RelatedEntityName,
        string? RelatedEntityCode,
        int? RelatedEntityID,
        string? TriggeredByUserCode,
        bool IsGlobal,
        DateTime CreatedAt,
        DateTime? ExpiresAt);

    public record NotificationRecipientReadDto(
        int RecipientID,
        int NotificationID,
        int TargetUserID,
        string TargetUserCode,
        string DeliveryState,
        bool IsRead,
        DateTime? ReadAt,
        DateTime? SeenAt,
        DateTime? DismissedAt,
        DateTime CreatedAt,
        NotificationReadDto Notification);

    public record NotificationUnreadCountDto(
        int UnreadCount);

    public record NotificationPreferenceReadDto(
        int PreferenceID,
        string NotifCategory,
        bool InAppEnabled,
        bool EmailEnabled,
        bool PushEnabled,
        string DigestMode,
        string? QuietFrom,
        string? QuietTo,
        DateTime? UpdatedAt);

    public class NotificationFilter : BaseFilter
    {
        public bool? IsRead { get; set; }
        public string? NotifCategory { get; set; }
        public string? NotifPriority { get; set; }
        public bool IncludeDismissed { get; set; } = false;
    }

    public class NotificationPreferenceFilter : BaseFilter
    {
        public string? NotifCategory { get; set; }
    }
}

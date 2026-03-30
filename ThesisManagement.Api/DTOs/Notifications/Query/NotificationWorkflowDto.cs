namespace ThesisManagement.Api.DTOs.Notifications.Query
{
    public record NotificationRealtimeDto(
        int RecipientID,
        string NotificationCode,
        string NotifCategory,
        string NotifTitle,
        string? ActionUrl,
        string NotifPriority,
        bool IsRead,
        string CreatedAtIso,
        int UnreadCount);
}

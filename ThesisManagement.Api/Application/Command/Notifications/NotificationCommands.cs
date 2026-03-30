using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public record NotificationEventRequest(
        string NotifCategory,
        string NotifTitle,
        string NotifBody,
        string? NotifPriority,
        string? ActionType,
        string? ActionUrl,
        string? RelatedEntityName,
        string? RelatedEntityCode,
        int? RelatedEntityID,
        bool IsGlobal,
        List<string> TargetUserCodes,
        string? NotifChannel = "IN_APP");

    public interface INotificationEventPublisher
    {
        Task PublishAsync(NotificationEventRequest request);
    }

    public interface ICreateNotificationCommand
    {
        Task<OperationResult<NotificationRecipientReadDto>> ExecuteAsync(CreateNotificationDto dto);
    }

    public interface IMarkNotificationReadCommand
    {
        Task<OperationResult<NotificationUnreadCountDto>> ExecuteAsync(MarkReadDto dto);
    }

    public interface IMarkAllNotificationsReadCommand
    {
        Task<OperationResult<NotificationUnreadCountDto>> ExecuteAsync(MarkReadAllDto dto);
    }

    public interface IUpdateMyNotificationPreferenceCommand
    {
        Task<OperationResult<NotificationPreferenceReadDto>> ExecuteAsync(string notifCategory, UpdateNotificationPreferenceDto dto);
    }
}

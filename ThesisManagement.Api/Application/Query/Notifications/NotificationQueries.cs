using ThesisManagement.Api.DTOs.Notifications.Query;

namespace ThesisManagement.Api.Application.Query.Notifications
{
    public interface IGetMyNotificationsListQuery
    {
        Task<(IEnumerable<NotificationRecipientReadDto> Items, int TotalCount)> ExecuteAsync(NotificationFilter filter);
    }

    public interface IGetMyUnreadCountQuery
    {
        Task<NotificationUnreadCountDto> ExecuteAsync();
    }

    public interface IGetMyNotificationPreferencesQuery
    {
        Task<IEnumerable<NotificationPreferenceReadDto>> ExecuteAsync(NotificationPreferenceFilter filter);
    }
}

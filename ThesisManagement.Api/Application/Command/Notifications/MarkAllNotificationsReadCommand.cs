using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public class MarkAllNotificationsReadCommand : IMarkAllNotificationsReadCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public MarkAllNotificationsReadCommand(IUnitOfWork uow, ICurrentUserService currentUserService, IHubContext<NotificationHub> hubContext)
        {
            _uow = uow;
            _currentUserService = currentUserService;
            _hubContext = hubContext;
        }

        public async Task<OperationResult<NotificationUnreadCountDto>> ExecuteAsync(MarkReadAllDto dto)
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();
            if (!userId.HasValue || string.IsNullOrWhiteSpace(userCode))
                return OperationResult<NotificationUnreadCountDto>.Failed("Unauthorized", 401);

            var recipients = await _uow.NotificationRecipients.Query()
                .Where(x => x.TargetUserID == userId.Value && x.IsRead == 0 && !x.DismissedAt.HasValue)
                .ToListAsync();

            if (!string.IsNullOrWhiteSpace(dto.NotifCategory) && recipients.Count > 0)
            {
                var targetIds = recipients.Select(x => x.NotificationID).Distinct().ToList();
                var categoryIds = await _uow.Notifications.Query()
                    .Where(x => targetIds.Contains(x.NotificationID) && x.NotifCategory == dto.NotifCategory)
                    .Select(x => x.NotificationID)
                    .ToListAsync();

                recipients = recipients.Where(x => categoryIds.Contains(x.NotificationID)).ToList();
            }

            foreach (var recipient in recipients)
            {
                recipient.IsRead = 1;
                recipient.ReadAt = DateTime.UtcNow;
                recipient.UpdatedAt = DateTime.UtcNow;
                _uow.NotificationRecipients.Update(recipient);
            }

            await _uow.SaveChangesAsync();

            var unread = await _uow.NotificationRecipients.Query()
                .Where(x => x.TargetUserID == userId.Value && x.IsRead == 0 && !x.DismissedAt.HasValue)
                .CountAsync();

            var result = new NotificationUnreadCountDto(unread);

            await _hubContext.Clients
                .Group(NotificationHubGroups.User(userCode))
                .SendAsync("notification.unreadCountChanged", result);

            return OperationResult<NotificationUnreadCountDto>.Succeeded(result);
        }
    }
}

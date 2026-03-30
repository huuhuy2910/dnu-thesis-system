using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public class MarkNotificationReadCommand : IMarkNotificationReadCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public MarkNotificationReadCommand(IUnitOfWork uow, ICurrentUserService currentUserService, IHubContext<NotificationHub> hubContext)
        {
            _uow = uow;
            _currentUserService = currentUserService;
            _hubContext = hubContext;
        }

        public async Task<OperationResult<NotificationUnreadCountDto>> ExecuteAsync(MarkReadDto dto)
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();
            if (!userId.HasValue || string.IsNullOrWhiteSpace(userCode))
                return OperationResult<NotificationUnreadCountDto>.Failed("Unauthorized", 401);

            var recipient = await _uow.NotificationRecipients.Query()
                .FirstOrDefaultAsync(x => x.RecipientID == dto.RecipientID && x.TargetUserID == userId.Value);

            if (recipient == null)
                return OperationResult<NotificationUnreadCountDto>.Failed("Notification recipient not found", 404);

            if (recipient.IsRead == 0)
            {
                recipient.IsRead = 1;
                recipient.ReadAt = DateTime.UtcNow;
                recipient.UpdatedAt = DateTime.UtcNow;
                _uow.NotificationRecipients.Update(recipient);
                await _uow.SaveChangesAsync();
            }

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

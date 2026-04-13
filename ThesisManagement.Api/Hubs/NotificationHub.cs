using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ThesisManagement.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userCode = GetUserCode();
            if (!string.IsNullOrWhiteSpace(userCode))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, NotificationHubGroups.User(userCode));
            }

            await base.OnConnectedAsync();
        }

        public async Task JoinMyNotifications()
        {
            var userCode = GetUserCode();
            if (string.IsNullOrWhiteSpace(userCode))
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, NotificationHubGroups.User(userCode));
        }

        private string? GetUserCode()
        {
            var claim = Context.User?.FindFirst("userCode")
                        ?? Context.User?.FindFirst(ClaimTypes.Name)
                        ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier);
            return claim?.Value;
        }
    }
}

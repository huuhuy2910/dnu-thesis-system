using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ThesisManagement.Api.Hubs
{
    [Authorize]
    public class DefenseHub : Hub
    {
        public static string CommitteeGroup(int committeeId) => $"defense-committee-{committeeId}";

        public async Task JoinCommittee(int committeeId)
        {
            if (committeeId <= 0)
            {
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, CommitteeGroup(committeeId));
        }

        public async Task LeaveCommittee(int committeeId)
        {
            if (committeeId <= 0)
            {
                return;
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, CommitteeGroup(committeeId));
        }
    }
}

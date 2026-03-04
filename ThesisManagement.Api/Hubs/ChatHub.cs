using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUnitOfWork _uow;

        public ChatHub(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task JoinConversation(string conversationCode)
        {
            if (string.IsNullOrWhiteSpace(conversationCode))
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.Conversation(conversationCode));
        }

        public async Task JoinConversationById(int conversationId)
        {
            if (conversationId <= 0)
                return;

            var conversation = await _uow.Conversations.GetByIdAsync(conversationId);
            if (conversation == null || string.IsNullOrWhiteSpace(conversation.ConversationCode))
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, ChatHubGroups.Conversation(conversation.ConversationCode));
        }

        public async Task LeaveConversation(string conversationCode)
        {
            if (string.IsNullOrWhiteSpace(conversationCode))
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ChatHubGroups.Conversation(conversationCode));
        }

        public async Task LeaveConversationById(int conversationId)
        {
            if (conversationId <= 0)
                return;

            var conversation = await _uow.Conversations.GetByIdAsync(conversationId);
            if (conversation == null || string.IsNullOrWhiteSpace(conversation.ConversationCode))
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ChatHubGroups.Conversation(conversation.ConversationCode));
        }
    }
}

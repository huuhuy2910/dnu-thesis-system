using ThesisManagement.Api.DTOs.Conversations.Command;

namespace ThesisManagement.Api.Application.Query.Conversations
{
    public interface IGetConversationCreateQuery
    {
        Task<ConversationCreateDto> ExecuteAsync();
    }

    public class GetConversationCreateQuery : IGetConversationCreateQuery
    {
        public Task<ConversationCreateDto> ExecuteAsync()
            => Task.FromResult(new ConversationCreateDto("DIRECT", null, null, null, null, false));
    }
}

using ThesisManagement.Api.DTOs.Conversations.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Conversations
{
    public interface IGetConversationUpdateQuery
    {
        Task<ConversationUpdateDto?> ExecuteAsync(int id);
    }

    public class GetConversationUpdateQuery : IGetConversationUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetConversationUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<ConversationUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Conversations.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new ConversationUpdateDto(
                entity.ConversationType,
                entity.Title,
                entity.AvatarURL,
                entity.IsArchived,
                entity.LastUpdated);
        }
    }
}

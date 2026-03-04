using AutoMapper;
using ThesisManagement.Api.DTOs.Conversations.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Conversations
{
    public interface IGetConversationDetailQuery
    {
        Task<ConversationReadDto?> ExecuteAsync(int id);
    }

    public class GetConversationDetailQuery : IGetConversationDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetConversationDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<ConversationReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Conversations.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<ConversationReadDto>(entity);
        }
    }
}

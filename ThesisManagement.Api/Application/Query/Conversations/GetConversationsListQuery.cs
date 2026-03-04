using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Conversations.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Conversations
{
    public interface IGetConversationsListQuery
    {
        Task<(IEnumerable<ConversationReadDto> Items, int TotalCount)> ExecuteAsync(ConversationFilter filter);
    }

    public class GetConversationsListQuery : IGetConversationsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetConversationsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<ConversationReadDto> Items, int TotalCount)> ExecuteAsync(ConversationFilter filter)
        {
            var query = _uow.Conversations.Query();

            if (filter.ConversationID.HasValue)
                query = query.Where(x => x.ConversationID == filter.ConversationID.Value);
            if (!string.IsNullOrWhiteSpace(filter.ConversationCode))
                query = query.Where(x => x.ConversationCode == filter.ConversationCode);
            if (!string.IsNullOrWhiteSpace(filter.Search))
                query = query.Where(x => (x.Title ?? "").Contains(filter.Search) || x.ConversationCode.Contains(filter.Search));
            if (!string.IsNullOrWhiteSpace(filter.ConversationType))
                query = query.Where(x => x.ConversationType == filter.ConversationType);
            if (!string.IsNullOrWhiteSpace(filter.CreatedByUserCode))
                query = query.Where(x => x.CreatedByUserCode == filter.CreatedByUserCode);
            if (filter.IsArchived.HasValue)
                query = query.Where(x => x.IsArchived == filter.IsArchived.Value);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.LastUpdated ?? x.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (entities.Select(x => _mapper.Map<ConversationReadDto>(x)), totalCount);
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.ConversationMembers.Command;
using ThesisManagement.Api.DTOs.ConversationMembers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ConversationMembers
{
    public interface IGetConversationMembersListQuery
    {
        Task<(IEnumerable<ConversationMemberReadDto> Items, int TotalCount)> ExecuteAsync(ConversationMemberFilter filter);
    }

    public interface IGetConversationMemberDetailQuery
    {
        Task<ConversationMemberReadDto?> ExecuteAsync(int id);
    }

    public interface IGetConversationMemberCreateQuery
    {
        Task<ConversationMemberCreateDto> ExecuteAsync();
    }

    public interface IGetConversationMemberUpdateQuery
    {
        Task<ConversationMemberUpdateDto?> ExecuteAsync(int id);
    }

    public class GetConversationMembersListQuery : IGetConversationMembersListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetConversationMembersListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<ConversationMemberReadDto> Items, int TotalCount)> ExecuteAsync(ConversationMemberFilter filter)
        {
            var query = _uow.ConversationMembers.Query();

            if (filter.ConversationID.HasValue)
                query = query.Where(x => x.ConversationID == filter.ConversationID.Value);
            if (!string.IsNullOrWhiteSpace(filter.UserCode))
                query = query.Where(x => x.UserCode == filter.UserCode);
            if (!string.IsNullOrWhiteSpace(filter.MemberRole))
                query = query.Where(x => x.MemberRole == filter.MemberRole);
            if (filter.IsActive.HasValue)
                query = filter.IsActive.Value
                    ? query.Where(x => x.LeftAt == null)
                    : query.Where(x => x.LeftAt != null);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.JoinedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (entities.Select(x => _mapper.Map<ConversationMemberReadDto>(x)), totalCount);
        }
    }

    public class GetConversationMemberDetailQuery : IGetConversationMemberDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetConversationMemberDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<ConversationMemberReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.ConversationMembers.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<ConversationMemberReadDto>(entity);
        }
    }

    public class GetConversationMemberCreateQuery : IGetConversationMemberCreateQuery
    {
        public Task<ConversationMemberCreateDto> ExecuteAsync()
            => Task.FromResult(new ConversationMemberCreateDto(0, null, string.Empty, "Member", false, false));
    }

    public class GetConversationMemberUpdateQuery : IGetConversationMemberUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetConversationMemberUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<ConversationMemberUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.ConversationMembers.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new ConversationMemberUpdateDto(
                entity.MemberRole,
                entity.NickName,
                entity.IsMuted,
                entity.IsPinned,
                entity.JoinedAt,
                entity.LeftAt,
                entity.LastReadMessageID,
                entity.LastReadAt,
                entity.UnreadCount);
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Messages.Command;
using ThesisManagement.Api.DTOs.Messages.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Messages
{
    public interface IGetMessagesListQuery
    {
        Task<(IEnumerable<MessageReadDto> Items, int TotalCount)> ExecuteAsync(MessageFilter filter);
    }

    public interface IGetMessageDetailQuery
    {
        Task<MessageReadDto?> ExecuteAsync(int id);
    }

    public interface IGetMessageCreateQuery
    {
        Task<MessageCreateDto> ExecuteAsync();
    }

    public interface IGetMessageUpdateQuery
    {
        Task<MessageUpdateDto?> ExecuteAsync(int id);
    }

    public class GetMessagesListQuery : IGetMessagesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessagesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<MessageReadDto> Items, int TotalCount)> ExecuteAsync(MessageFilter filter)
        {
            var query = _uow.Messages.Query();

            if (filter.ConversationID.HasValue)
                query = query.Where(x => x.ConversationID == filter.ConversationID.Value);
            if (!string.IsNullOrWhiteSpace(filter.SenderUserCode))
                query = query.Where(x => x.SenderUserCode == filter.SenderUserCode);
            if (!string.IsNullOrWhiteSpace(filter.MessageType))
                query = query.Where(x => x.MessageType == filter.MessageType);
            if (filter.IsDeleted.HasValue)
                query = query.Where(x => x.IsDeleted == filter.IsDeleted.Value);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.SentAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (entities.Select(x => _mapper.Map<MessageReadDto>(x)), totalCount);
        }
    }

    public class GetMessageDetailQuery : IGetMessageDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<MessageReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Messages.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<MessageReadDto>(entity);
        }
    }

    public class GetMessageCreateQuery : IGetMessageCreateQuery
    {
        public Task<MessageCreateDto> ExecuteAsync()
            => Task.FromResult(new MessageCreateDto(0, string.Empty, null, "TEXT", null));
    }

    public class GetMessageUpdateQuery : IGetMessageUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetMessageUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<MessageUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Messages.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new MessageUpdateDto(entity.Content, entity.MessageType, entity.IsDeleted, entity.EditedAt, entity.DeletedAt);
        }
    }
}

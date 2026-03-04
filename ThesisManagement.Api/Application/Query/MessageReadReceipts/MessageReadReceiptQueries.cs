using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Command;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MessageReadReceipts
{
    public interface IGetMessageReadReceiptsListQuery
    {
        Task<(IEnumerable<MessageReadReceiptReadDto> Items, int TotalCount)> ExecuteAsync(MessageReadReceiptFilter filter);
    }

    public interface IGetMessageReadReceiptDetailQuery
    {
        Task<MessageReadReceiptReadDto?> ExecuteAsync(int id);
    }

    public interface IGetMessageReadReceiptCreateQuery
    {
        Task<MessageReadReceiptCreateDto> ExecuteAsync();
    }

    public interface IGetMessageReadReceiptUpdateQuery
    {
        Task<MessageReadReceiptUpdateDto?> ExecuteAsync(int id);
    }

    public class GetMessageReadReceiptsListQuery : IGetMessageReadReceiptsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageReadReceiptsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<MessageReadReceiptReadDto> Items, int TotalCount)> ExecuteAsync(MessageReadReceiptFilter filter)
        {
            var query = _uow.MessageReadReceipts.Query();

            if (filter.MessageID.HasValue)
                query = query.Where(x => x.MessageID == filter.MessageID.Value);
            if (!string.IsNullOrWhiteSpace(filter.UserCode))
                query = query.Where(x => x.UserCode == filter.UserCode);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.ReadAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (entities.Select(x => _mapper.Map<MessageReadReceiptReadDto>(x)), totalCount);
        }
    }

    public class GetMessageReadReceiptDetailQuery : IGetMessageReadReceiptDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageReadReceiptDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<MessageReadReceiptReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageReadReceipts.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<MessageReadReceiptReadDto>(entity);
        }
    }

    public class GetMessageReadReceiptCreateQuery : IGetMessageReadReceiptCreateQuery
    {
        public Task<MessageReadReceiptCreateDto> ExecuteAsync()
            => Task.FromResult(new MessageReadReceiptCreateDto(0, string.Empty, null));
    }

    public class GetMessageReadReceiptUpdateQuery : IGetMessageReadReceiptUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetMessageReadReceiptUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<MessageReadReceiptUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageReadReceipts.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new MessageReadReceiptUpdateDto(entity.ReadAt);
        }
    }
}

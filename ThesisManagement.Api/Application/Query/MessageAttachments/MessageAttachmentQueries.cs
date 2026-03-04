using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.MessageAttachments.Command;
using ThesisManagement.Api.DTOs.MessageAttachments.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MessageAttachments
{
    public interface IGetMessageAttachmentsListQuery
    {
        Task<(IEnumerable<MessageAttachmentReadDto> Items, int TotalCount)> ExecuteAsync(MessageAttachmentFilter filter);
    }

    public interface IGetMessageAttachmentDetailQuery
    {
        Task<MessageAttachmentReadDto?> ExecuteAsync(int id);
    }

    public interface IGetMessageAttachmentCreateQuery
    {
        Task<MessageAttachmentCreateDto> ExecuteAsync();
    }

    public interface IGetMessageAttachmentUpdateQuery
    {
        Task<MessageAttachmentUpdateDto?> ExecuteAsync(int id);
    }

    public class GetMessageAttachmentsListQuery : IGetMessageAttachmentsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageAttachmentsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<MessageAttachmentReadDto> Items, int TotalCount)> ExecuteAsync(MessageAttachmentFilter filter)
        {
            var query = _uow.MessageAttachments.Query();

            if (filter.MessageID.HasValue)
                query = query.Where(x => x.MessageID == filter.MessageID.Value);
            if (!string.IsNullOrWhiteSpace(filter.MimeType))
                query = query.Where(x => x.MimeType == filter.MimeType);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.UploadedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (entities.Select(x => _mapper.Map<MessageAttachmentReadDto>(x)), totalCount);
        }
    }

    public class GetMessageAttachmentDetailQuery : IGetMessageAttachmentDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageAttachmentDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<MessageAttachmentReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageAttachments.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<MessageAttachmentReadDto>(entity);
        }
    }

    public class GetMessageAttachmentCreateQuery : IGetMessageAttachmentCreateQuery
    {
        public Task<MessageAttachmentCreateDto> ExecuteAsync()
            => Task.FromResult(new MessageAttachmentCreateDto(0, string.Empty, null, null, null, null));
    }

    public class GetMessageAttachmentUpdateQuery : IGetMessageAttachmentUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetMessageAttachmentUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<MessageAttachmentUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageAttachments.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new MessageAttachmentUpdateDto(entity.FileUrl, entity.FileName, entity.MimeType, entity.FileSizeBytes, entity.ThumbnailURL);
        }
    }
}

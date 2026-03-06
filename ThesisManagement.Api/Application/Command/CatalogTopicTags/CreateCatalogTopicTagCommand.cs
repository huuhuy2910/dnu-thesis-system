using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.CatalogTopicTags;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Command;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopicTags
{
    public interface ICreateCatalogTopicTagCommand
    {
        Task<OperationResult<CatalogTopicTagReadDto>> ExecuteAsync(CatalogTopicTagCreateDto dto);
    }

    public class CreateCatalogTopicTagCommand : ICreateCatalogTopicTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateCatalogTopicTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<CatalogTopicTagReadDto>> ExecuteAsync(CatalogTopicTagCreateDto dto)
        {
            var validationError = CatalogTopicTagCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CatalogTopicTagReadDto>.Failed(validationError, 400);

            var catalogTopicId = dto.CatalogTopicID ?? 0;
            if (catalogTopicId == 0 && !string.IsNullOrWhiteSpace(dto.CatalogTopicCode))
            {
                var catalogTopic = await _uow.CatalogTopics.Query().FirstOrDefaultAsync(x => x.CatalogTopicCode == dto.CatalogTopicCode);
                if (catalogTopic == null)
                    return OperationResult<CatalogTopicTagReadDto>.Failed($"CatalogTopic with code '{dto.CatalogTopicCode}' not found", 404);
                catalogTopicId = catalogTopic.CatalogTopicID;
            }

            var tagId = dto.TagID ?? 0;
            if (tagId == 0 && !string.IsNullOrWhiteSpace(dto.TagCode))
            {
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(x => x.TagCode == dto.TagCode);
                if (tag == null)
                    return OperationResult<CatalogTopicTagReadDto>.Failed($"Tag with code '{dto.TagCode}' not found", 404);
                tagId = tag.TagID;
            }

            if (catalogTopicId == 0 || tagId == 0)
                return OperationResult<CatalogTopicTagReadDto>.Failed("CatalogTopicID and TagID are required", 400);

            var exists = await _uow.CatalogTopicTags.Query().AnyAsync(x => x.CatalogTopicID == catalogTopicId && x.TagID == tagId);
            if (exists)
                return OperationResult<CatalogTopicTagReadDto>.Failed("This catalog topic-tag relationship already exists", 400);

            var entity = new CatalogTopicTag
            {
                CatalogTopicID = catalogTopicId,
                TagID = tagId,
                CatalogTopicCode = dto.CatalogTopicCode,
                TagCode = dto.TagCode,
                CreatedAt = DateTime.Now
            };

            await _uow.CatalogTopicTags.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<CatalogTopicTagReadDto>.Succeeded(_mapper.Map<CatalogTopicTagReadDto>(entity));
        }
    }
}

using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Command;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopicTags
{
    public interface IUpdateCatalogTopicTagCommand
    {
        Task<OperationResult<CatalogTopicTagReadDto>> ExecuteAsync(int catalogTopicId, int tagId, CatalogTopicTagUpdateDto dto);
    }

    public class UpdateCatalogTopicTagCommand : IUpdateCatalogTopicTagCommand
    {
        private readonly IUnitOfWork _uow;

        public UpdateCatalogTopicTagCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<CatalogTopicTagReadDto>> ExecuteAsync(int catalogTopicId, int tagId, CatalogTopicTagUpdateDto dto)
        {
            var entity = await _uow.CatalogTopicTags.Query().FirstOrDefaultAsync(x => x.CatalogTopicID == catalogTopicId && x.TagID == tagId);
            if (entity == null)
                return OperationResult<CatalogTopicTagReadDto>.Failed("CatalogTopicTag not found", 404);

            var nextCatalogTopicId = dto.CatalogTopicID ?? catalogTopicId;
            var nextTagId = dto.TagID ?? tagId;
            var nextCatalogTopicCode = dto.CatalogTopicCode ?? entity.CatalogTopicCode;
            var nextTagCode = dto.TagCode ?? entity.TagCode;

            if (dto.CatalogTopicID.HasValue == false && !string.IsNullOrWhiteSpace(dto.CatalogTopicCode))
            {
                var catalogTopic = await _uow.CatalogTopics.Query().FirstOrDefaultAsync(x => x.CatalogTopicCode == dto.CatalogTopicCode);
                if (catalogTopic == null)
                    return OperationResult<CatalogTopicTagReadDto>.Failed($"CatalogTopic with code '{dto.CatalogTopicCode}' not found", 404);
                nextCatalogTopicId = catalogTopic.CatalogTopicID;
                nextCatalogTopicCode = catalogTopic.CatalogTopicCode;
            }

            if (dto.TagID.HasValue == false && !string.IsNullOrWhiteSpace(dto.TagCode))
            {
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(x => x.TagCode == dto.TagCode);
                if (tag == null)
                    return OperationResult<CatalogTopicTagReadDto>.Failed($"Tag with code '{dto.TagCode}' not found", 404);
                nextTagId = tag.TagID;
                nextTagCode = tag.TagCode;
            }

            var duplicate = await _uow.CatalogTopicTags.Query().AnyAsync(x =>
                x.CatalogTopicID == nextCatalogTopicId &&
                x.TagID == nextTagId &&
                !(x.CatalogTopicID == catalogTopicId && x.TagID == tagId));

            if (duplicate)
                return OperationResult<CatalogTopicTagReadDto>.Failed("This catalog topic-tag relationship already exists", 400);

            _uow.CatalogTopicTags.Remove(entity);
            await _uow.CatalogTopicTags.AddAsync(new Models.CatalogTopicTag
            {
                CatalogTopicID = nextCatalogTopicId,
                TagID = nextTagId,
                CatalogTopicCode = nextCatalogTopicCode,
                TagCode = nextTagCode,
                CreatedAt = entity.CreatedAt
            });
            await _uow.SaveChangesAsync();

            return OperationResult<CatalogTopicTagReadDto>.Succeeded(new CatalogTopicTagReadDto(
                nextCatalogTopicId,
                nextTagId,
                nextCatalogTopicCode,
                nextTagCode,
                entity.CreatedAt));
        }
    }
}

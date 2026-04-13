using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.CatalogTopics;
using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopics
{
    public interface IUpdateCatalogTopicCommand
    {
        Task<OperationResult<CatalogTopicWithTagsReadDto>> ExecuteAsync(string code, CatalogTopicUpdateDto dto);
    }

    public class UpdateCatalogTopicCommand : IUpdateCatalogTopicCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateCatalogTopicCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<CatalogTopicWithTagsReadDto>> ExecuteAsync(string code, CatalogTopicUpdateDto dto)
        {
            var validationError = CatalogTopicCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CatalogTopicWithTagsReadDto>.Failed(validationError, 400);

            var entity = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<CatalogTopicWithTagsReadDto>.Failed("CatalogTopic not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Title))
                entity.Title = dto.Title.Trim();

            entity.Summary = dto.Summary;

            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                var department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                entity.DepartmentID = department?.DepartmentID;
                entity.DepartmentCode = dto.DepartmentCode;
            }

            entity.AssignedStatus = dto.AssignedStatus;
            entity.AssignedAt = dto.AssignedAt;
            entity.LastUpdated = DateTime.UtcNow;

            if (dto.TagIDs != null || dto.TagCodes != null)
            {
                var desiredTagIds = new HashSet<int>();

                if (dto.TagIDs != null)
                {
                    foreach (var tagId in dto.TagIDs.Where(x => x > 0).Distinct())
                        desiredTagIds.Add(tagId);

                    var existingTagIds = await _uow.Tags.Query()
                        .Where(x => desiredTagIds.Contains(x.TagID))
                        .Select(x => x.TagID)
                        .ToListAsync();

                    if (existingTagIds.Count != desiredTagIds.Count)
                        return OperationResult<CatalogTopicWithTagsReadDto>.Failed("One or more TagIDs are invalid", 400);
                }

                if (dto.TagCodes != null)
                {
                    var requestedTagCodes = dto.TagCodes
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .Select(x => x.Trim())
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    var normalizedTagCodes = requestedTagCodes
                        .Select(x => x.ToUpperInvariant())
                        .ToHashSet();

                    var tagsByCode = await _uow.Tags.Query()
                        .Where(x => normalizedTagCodes.Contains(x.TagCode.ToUpper()))
                        .Select(x => new { x.TagID, x.TagCode })
                        .ToListAsync();

                    if (tagsByCode.Count != requestedTagCodes.Count)
                        return OperationResult<CatalogTopicWithTagsReadDto>.Failed("One or more TagCodes are invalid", 400);

                    foreach (var tag in tagsByCode)
                        desiredTagIds.Add(tag.TagID);
                }

                var currentLinks = await _uow.CatalogTopicTags.Query()
                    .Where(x => x.CatalogTopicID == entity.CatalogTopicID)
                    .ToListAsync();

                var toRemove = currentLinks
                    .Where(x => !desiredTagIds.Contains(x.TagID))
                    .ToList();

                foreach (var link in toRemove)
                    _uow.CatalogTopicTags.Remove(link);

                var existingLinkIds = currentLinks.Select(x => x.TagID).ToHashSet();
                var toAdd = desiredTagIds.Where(x => !existingLinkIds.Contains(x)).ToList();

                if (toAdd.Count > 0)
                {
                    var tagMap = await _uow.Tags.Query()
                        .Where(x => toAdd.Contains(x.TagID))
                        .Select(x => new { x.TagID, x.TagCode })
                        .ToListAsync();

                    foreach (var tag in tagMap)
                    {
                        await _uow.CatalogTopicTags.AddAsync(new CatalogTopicTag
                        {
                            CatalogTopicID = entity.CatalogTopicID,
                            CatalogTopicCode = entity.CatalogTopicCode,
                            TagID = tag.TagID,
                            TagCode = tag.TagCode,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            _uow.CatalogTopics.Update(entity);
            await _uow.SaveChangesAsync();

            var updated = await _uow.CatalogTopics.Query()
                .AsNoTracking()
                .Include(x => x.CatalogTopicTags!)
                    .ThenInclude(x => x.Tag)
                .FirstOrDefaultAsync(x => x.CatalogTopicID == entity.CatalogTopicID);

            if (updated == null)
                return OperationResult<CatalogTopicWithTagsReadDto>.Failed("CatalogTopic not found", 404);

            return OperationResult<CatalogTopicWithTagsReadDto>.Succeeded(MapWithTags(updated));
        }

        private static CatalogTopicWithTagsReadDto MapWithTags(CatalogTopic entity)
        {
            var tags = entity.CatalogTopicTags?
                .Where(x => x.Tag != null)
                .Select(x => new CatalogTopicTagItemDto(
                    x.TagID,
                    x.TagCode ?? x.Tag!.TagCode,
                    x.Tag!.TagName))
                .GroupBy(x => x.TagID)
                .Select(x => x.First())
                .OrderBy(x => x.TagCode)
                .ToList() ?? new List<CatalogTopicTagItemDto>();

            return new CatalogTopicWithTagsReadDto(
                entity.CatalogTopicID,
                entity.CatalogTopicCode,
                entity.Title,
                entity.Summary,
                entity.DepartmentCode,
                entity.AssignedStatus,
                entity.AssignedAt,
                entity.CreatedAt,
                entity.LastUpdated,
                tags);
        }
    }
}

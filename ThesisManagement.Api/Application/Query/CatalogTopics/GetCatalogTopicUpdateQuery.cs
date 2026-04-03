using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicUpdateQuery
    {
        Task<CatalogTopicWithTagsReadDto?> ExecuteAsync(string code);
    }

    public class GetCatalogTopicUpdateQuery : IGetCatalogTopicUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetCatalogTopicUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<CatalogTopicWithTagsReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.CatalogTopics.Query()
                .AsNoTracking()
                .Include(x => x.CatalogTopicTags!)
                    .ThenInclude(x => x.Tag)
                .FirstOrDefaultAsync(x => x.CatalogTopicCode == code);

            if (entity == null)
                return null;

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

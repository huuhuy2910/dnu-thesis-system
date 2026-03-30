using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicsWithTagsListQuery
    {
        Task<(IEnumerable<CatalogTopicWithTagsReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicWithTagsFilter filter);
    }

    public class GetCatalogTopicsWithTagsListQuery : IGetCatalogTopicsWithTagsListQuery
    {
        private readonly IUnitOfWork _uow;

        public GetCatalogTopicsWithTagsListQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<(IEnumerable<CatalogTopicWithTagsReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicWithTagsFilter filter)
        {
            var query = _uow.CatalogTopics.Query().AsNoTracking();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var keyword = filter.Search.Trim();
                query = query.Where(x => x.Title.Contains(keyword)
                    || x.CatalogTopicCode.Contains(keyword)
                    || (x.Summary != null && x.Summary.Contains(keyword)));
            }

            if (!string.IsNullOrWhiteSpace(filter.Title))
                query = query.Where(x => x.Title.Contains(filter.Title));

            if (!string.IsNullOrWhiteSpace(filter.CatalogTopicCode))
                query = query.Where(x => x.CatalogTopicCode.Contains(filter.CatalogTopicCode));

            if (!string.IsNullOrWhiteSpace(filter.DepartmentCode))
                query = query.Where(x => x.DepartmentCode == filter.DepartmentCode);

            if (!string.IsNullOrWhiteSpace(filter.AssignedStatus))
                query = query.Where(x => x.AssignedStatus == filter.AssignedStatus);

            if (filter.FromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(x => x.CreatedAt <= filter.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(filter.TagCode) || !string.IsNullOrWhiteSpace(filter.TagName))
            {
                var tagCode = filter.TagCode?.Trim();
                var tagName = filter.TagName?.Trim();

                var matchedTopicIds =
                    from link in _uow.CatalogTopicTags.Query()
                    join tag in _uow.Tags.Query() on link.TagID equals tag.TagID
                    where (string.IsNullOrWhiteSpace(tagCode)
                            || tag.TagCode.Contains(tagCode)
                            || (link.TagCode != null && link.TagCode.Contains(tagCode)))
                       && (string.IsNullOrWhiteSpace(tagName) || tag.TagName.Contains(tagName))
                    select link.CatalogTopicID;

                query = query.Where(x => matchedTopicIds.Contains(x.CatalogTopicID));
            }

            query = ApplySorting(query, filter);

            var totalCount = await query.CountAsync();
            var page = filter.Page <= 0 ? 1 : filter.Page;
            var pageSize = filter.PageSize <= 0 ? 10 : filter.PageSize;

            var topicItems = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var topicIds = topicItems.Select(x => x.CatalogTopicID).ToList();
            var topicTags = await (
                from link in _uow.CatalogTopicTags.Query().AsNoTracking()
                join tag in _uow.Tags.Query().AsNoTracking() on link.TagID equals tag.TagID
                where topicIds.Contains(link.CatalogTopicID)
                select new
                {
                    link.CatalogTopicID,
                    tag.TagID,
                    tag.TagCode,
                    tag.TagName
                })
                .ToListAsync();

            var tagsByTopicId = topicTags
                .GroupBy(x => x.CatalogTopicID)
                .ToDictionary(
                    x => x.Key,
                    x => (IReadOnlyList<CatalogTopicTagItemDto>)x
                        .OrderBy(t => t.TagCode)
                        .Select(t => new CatalogTopicTagItemDto(t.TagID, t.TagCode, t.TagName))
                        .ToList());

            var items = topicItems.Select(x => new CatalogTopicWithTagsReadDto(
                x.CatalogTopicID,
                x.CatalogTopicCode,
                x.Title,
                x.Summary,
                x.DepartmentCode,
                x.AssignedStatus,
                x.AssignedAt,
                x.CreatedAt,
                x.LastUpdated,
                tagsByTopicId.TryGetValue(x.CatalogTopicID, out var tags)
                    ? tags
                    : new List<CatalogTopicTagItemDto>()
            ));

            return (items, totalCount);
        }

        private static IQueryable<Models.CatalogTopic> ApplySorting(IQueryable<Models.CatalogTopic> query, CatalogTopicWithTagsFilter filter)
        {
            if (string.IsNullOrWhiteSpace(filter.SortBy))
                return query.OrderByDescending(x => x.LastUpdated ?? x.CreatedAt);

            var sortBy = filter.SortBy.Trim().ToLowerInvariant();
            var desc = filter.SortDescending;

            return sortBy switch
            {
                "catalogtopiccode" => desc ? query.OrderByDescending(x => x.CatalogTopicCode) : query.OrderBy(x => x.CatalogTopicCode),
                "title" => desc ? query.OrderByDescending(x => x.Title) : query.OrderBy(x => x.Title),
                "departmentcode" => desc ? query.OrderByDescending(x => x.DepartmentCode) : query.OrderBy(x => x.DepartmentCode),
                "assignedstatus" => desc ? query.OrderByDescending(x => x.AssignedStatus) : query.OrderBy(x => x.AssignedStatus),
                "assignedat" => desc ? query.OrderByDescending(x => x.AssignedAt) : query.OrderBy(x => x.AssignedAt),
                "createdat" => desc ? query.OrderByDescending(x => x.CreatedAt) : query.OrderBy(x => x.CreatedAt),
                "lastupdated" => desc ? query.OrderByDescending(x => x.LastUpdated) : query.OrderBy(x => x.LastUpdated),
                _ => desc ? query.OrderByDescending(x => x.LastUpdated ?? x.CreatedAt) : query.OrderBy(x => x.LastUpdated ?? x.CreatedAt)
            };
        }
    }
}

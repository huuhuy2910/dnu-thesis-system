using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Topics
{
    public interface IGetTopicsListQuery
    {
        Task<(IEnumerable<TopicReadDto> Items, int TotalCount)> ExecuteAsync(TopicFilter filter);
    }

    public class GetTopicsListQuery : IGetTopicsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<TopicReadDto> Items, int TotalCount)> ExecuteAsync(TopicFilter filter)
        {
            var tagCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (filter.TagCodes != null)
            {
                foreach (var code in filter.TagCodes)
                {
                    if (!string.IsNullOrWhiteSpace(code))
                        tagCodes.Add(code.Trim());
                }
            }

            if (!string.IsNullOrEmpty(filter.Tags))
            {
                var tagValues = filter.Tags.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var tag in tagValues)
                {
                    var value = tag.Trim();
                    if (!string.IsNullOrWhiteSpace(value))
                        tagCodes.Add(value);
                }
            }

            IEnumerable<Topic> items;
            int totalCount;

            if (tagCodes.Count > 0)
            {
                var filteredTopics = await _uow.Topics.Query()
                    .Where(t => _uow.TopicTags.Query()
                        .Any(tt => tt.TopicCode == t.TopicCode && tt.Tag != null && tagCodes.Contains(tt.Tag.TagCode)))
                    .ToListAsync();

                var tempFilter = new TopicFilter
                {
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    Search = filter.Search,
                    Title = filter.Title,
                    TopicCode = filter.TopicCode,
                    Tags = null,
                    TagCodes = null,
                    Type = filter.Type,
                    Status = filter.Status,
                    ProposerUserCode = filter.ProposerUserCode,
                    ProposerStudentCode = filter.ProposerStudentCode,
                    SupervisorUserCode = filter.SupervisorUserCode,
                    DepartmentCode = filter.DepartmentCode,
                    CatalogTopicCode = filter.CatalogTopicCode,
                    FromDate = filter.FromDate,
                    ToDate = filter.ToDate,
                    SortBy = filter.SortBy
                };

                var topicIds = filteredTopics.Select(ft => ft.TopicID).ToList();
                var result = await _uow.Topics.GetPagedWithFilterAsync(filter.Page, filter.PageSize, tempFilter,
                    (query, f) => query.Where(t => topicIds.Contains(t.TopicID)).ApplyFilter(f));

                items = result.Items;
                totalCount = result.TotalCount;
            }
            else
            {
                var result = await _uow.Topics.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                    (query, f) => query.ApplyFilter(f));

                items = result.Items;
                totalCount = result.TotalCount;
            }

            return (items.Select(x => _mapper.Map<TopicReadDto>(x)), totalCount);
        }
    }
}

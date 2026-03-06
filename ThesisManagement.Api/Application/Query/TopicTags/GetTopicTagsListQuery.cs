using AutoMapper;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicTags
{
    public interface IGetTopicTagsListQuery
    {
        Task<(IEnumerable<TopicTagReadDto> Items, int TotalCount)> ExecuteAsync(TopicTagFilter filter);
    }

    public class GetTopicTagsListQuery : IGetTopicTagsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicTagsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<TopicTagReadDto> Items, int TotalCount)> ExecuteAsync(TopicTagFilter filter)
        {
            var result = await _uow.TopicTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<TopicTagReadDto>(x)), result.TotalCount);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Tags
{
    public interface IGetTagsListQuery
    {
        Task<(IEnumerable<TagReadDto> Items, int TotalCount)> ExecuteAsync(TagFilter filter);
    }

    public class GetTagsListQuery : IGetTagsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTagsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<TagReadDto> Items, int TotalCount)> ExecuteAsync(TagFilter filter)
        {
            var result = await _uow.Tags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<TagReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopicTags
{
    public interface IGetCatalogTopicTagsListQuery
    {
        Task<(IEnumerable<CatalogTopicTagReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicTagFilter filter);
    }

    public class GetCatalogTopicTagsListQuery : IGetCatalogTopicTagsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicTagsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<CatalogTopicTagReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicTagFilter filter)
        {
            var result = await _uow.CatalogTopicTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x)), result.TotalCount);
        }
    }
}

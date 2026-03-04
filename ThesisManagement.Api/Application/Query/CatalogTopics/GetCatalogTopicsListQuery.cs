using AutoMapper;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicsListQuery
    {
        Task<(IEnumerable<CatalogTopicReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicFilter filter);
    }

    public class GetCatalogTopicsListQuery : IGetCatalogTopicsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<CatalogTopicReadDto> Items, int TotalCount)> ExecuteAsync(CatalogTopicFilter filter)
        {
            var result = await _uow.CatalogTopics.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<CatalogTopicReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}

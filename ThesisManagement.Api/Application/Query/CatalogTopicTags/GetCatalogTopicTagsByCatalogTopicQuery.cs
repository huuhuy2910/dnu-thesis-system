using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopicTags
{
    public interface IGetCatalogTopicTagsByCatalogTopicQuery
    {
        Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByIdAsync(int catalogTopicId);
        Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByCodeAsync(string catalogTopicCode);
    }

    public class GetCatalogTopicTagsByCatalogTopicQuery : IGetCatalogTopicTagsByCatalogTopicQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicTagsByCatalogTopicQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByIdAsync(int catalogTopicId)
        {
            var items = await _uow.CatalogTopicTags.Query().Where(x => x.CatalogTopicID == catalogTopicId).ToListAsync();
            return items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
        }

        public async Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByCodeAsync(string catalogTopicCode)
        {
            var items = await _uow.CatalogTopicTags.Query().Where(x => x.CatalogTopicCode == catalogTopicCode).ToListAsync();
            return items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
        }
    }
}

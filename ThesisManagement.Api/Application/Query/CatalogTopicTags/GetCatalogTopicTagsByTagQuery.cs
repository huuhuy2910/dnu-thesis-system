using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopicTags
{
    public interface IGetCatalogTopicTagsByTagQuery
    {
        Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByIdAsync(int tagId);
        Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByCodeAsync(string tagCode);
    }

    public class GetCatalogTopicTagsByTagQuery : IGetCatalogTopicTagsByTagQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicTagsByTagQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByIdAsync(int tagId)
        {
            var items = await _uow.CatalogTopicTags.Query().Where(x => x.TagID == tagId).ToListAsync();
            return items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
        }

        public async Task<IEnumerable<CatalogTopicTagReadDto>> ExecuteByCodeAsync(string tagCode)
        {
            var items = await _uow.CatalogTopicTags.Query().Where(x => x.TagCode == tagCode).ToListAsync();
            return items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.CatalogTopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopicTags
{
    public interface IGetCatalogTopicTagDetailQuery
    {
        Task<CatalogTopicTagReadDto?> ExecuteAsync(int catalogTopicId, int tagId);
    }

    public class GetCatalogTopicTagDetailQuery : IGetCatalogTopicTagDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicTagDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<CatalogTopicTagReadDto?> ExecuteAsync(int catalogTopicId, int tagId)
        {
            var item = await _uow.CatalogTopicTags.Query().FirstOrDefaultAsync(x => x.CatalogTopicID == catalogTopicId && x.TagID == tagId);
            return item == null ? null : _mapper.Map<CatalogTopicTagReadDto>(item);
        }
    }
}

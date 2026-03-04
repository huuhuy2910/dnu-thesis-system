using AutoMapper;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicDetailQuery
    {
        Task<CatalogTopicReadDto?> ExecuteAsync(string code);
    }

    public class GetCatalogTopicDetailQuery : IGetCatalogTopicDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCatalogTopicDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<CatalogTopicReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.CatalogTopics.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<CatalogTopicReadDto>(entity);
        }
    }
}

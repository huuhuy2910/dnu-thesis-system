using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicUpdateQuery
    {
        Task<CatalogTopicUpdateDto?> ExecuteAsync(string code);
    }

    public class GetCatalogTopicUpdateQuery : IGetCatalogTopicUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetCatalogTopicUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<CatalogTopicUpdateDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.CatalogTopics.GetByCodeAsync(code);
            return entity == null
                ? null
                : new CatalogTopicUpdateDto(entity.Title, entity.Summary, entity.DepartmentCode, entity.AssignedStatus, entity.AssignedAt);
        }
    }
}

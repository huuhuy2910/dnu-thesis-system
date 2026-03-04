using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopics
{
    public interface IDeleteCatalogTopicCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(string code);
    }

    public class DeleteCatalogTopicCommand : IDeleteCatalogTopicCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteCatalogTopicCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(string code)
        {
            var entity = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<object?>.Failed("CatalogTopic not found", 404);

            _uow.CatalogTopics.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

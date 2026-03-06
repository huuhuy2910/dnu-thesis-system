using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopicTags
{
    public interface IDeleteCatalogTopicTagCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int catalogTopicId, int tagId);
    }

    public class DeleteCatalogTopicTagCommand : IDeleteCatalogTopicTagCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteCatalogTopicTagCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int catalogTopicId, int tagId)
        {
            var entity = await _uow.CatalogTopicTags.Query().FirstOrDefaultAsync(x => x.CatalogTopicID == catalogTopicId && x.TagID == tagId);
            if (entity == null)
                return OperationResult<string>.Failed("CatalogTopicTag not found", 404);

            _uow.CatalogTopicTags.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<string>.Succeeded("CatalogTopicTag deleted successfully");
        }
    }
}

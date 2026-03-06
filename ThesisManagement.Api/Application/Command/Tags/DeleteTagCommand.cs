using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Tags
{
    public interface IDeleteTagCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public class DeleteTagCommand : IDeleteTagCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteTagCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var item = await _uow.Tags.GetByIdAsync(id);
            if (item == null)
                return OperationResult<string>.Failed("Tag not found", 404);

            var usedInCatalogTopics = await _uow.CatalogTopicTags.Query().AnyAsync(x => x.TagID == id);
            var usedInTopics = await _uow.TopicTags.Query().AnyAsync(x => x.TagID == id);
            var usedInLecturers = await _uow.LecturerTags.Query().AnyAsync(x => x.TagID == id);

            if (usedInCatalogTopics || usedInTopics || usedInLecturers)
                return OperationResult<string>.Failed("Cannot delete tag because it is being used", 400);

            _uow.Tags.Remove(item);
            await _uow.SaveChangesAsync();

            return OperationResult<string>.Succeeded("Tag deleted successfully");
        }
    }
}

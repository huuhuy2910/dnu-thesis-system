using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicTags
{
    public interface IDeleteTopicTagByTopicCodeCommand
    {
        Task<OperationResult<string>> ExecuteAsync(string topicCode, int topicTagID);
    }

    public class DeleteTopicTagByTopicCodeCommand : IDeleteTopicTagByTopicCodeCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteTopicTagByTopicCodeCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(string topicCode, int topicTagID)
        {
            var entity = await _uow.TopicTags.Query().FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagID && tt.TopicCode == topicCode);
            if (entity == null)
                return OperationResult<string>.Failed("TopicTag not found", 404);
            _uow.TopicTags.Remove(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<string>.Succeeded("TopicTag deleted successfully");
        }
    }
}

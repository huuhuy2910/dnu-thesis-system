using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Topics
{
    public interface IDeleteTopicCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteTopicCommand : IDeleteTopicCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteTopicCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.Topics.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Topic not found", 404);

            _uow.Topics.Remove(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<object?>.Succeeded(null);
        }
    }
}

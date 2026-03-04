using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressMilestones
{
    public interface IDeleteProgressMilestoneCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteProgressMilestoneCommand : IDeleteProgressMilestoneCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteProgressMilestoneCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.ProgressMilestones.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Milestone not found", 404);

            _uow.ProgressMilestones.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

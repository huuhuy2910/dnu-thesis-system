using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.MilestoneTemplates
{
    public interface IDeleteMilestoneTemplateCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteMilestoneTemplateCommand : IDeleteMilestoneTemplateCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteMilestoneTemplateCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.MilestoneTemplates.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Milestone template not found", 404);

            _uow.MilestoneTemplates.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Departments
{
    public interface IDeleteDepartmentCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteDepartmentCommand : IDeleteDepartmentCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteDepartmentCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.Departments.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Department not found", 404);

            _uow.Departments.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

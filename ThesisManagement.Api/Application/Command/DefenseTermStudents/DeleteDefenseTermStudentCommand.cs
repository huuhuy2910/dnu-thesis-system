using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTermStudents
{
    public interface IDeleteDefenseTermStudentCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public class DeleteDefenseTermStudentCommand : IDeleteDefenseTermStudentCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteDefenseTermStudentCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTermStudents.GetByIdAsync(id);
            if (item == null)
                return OperationResult<string>.Failed("DefenseTermStudent not found", 404);

            _uow.DefenseTermStudents.Remove(item);
            await _uow.SaveChangesAsync();
            return OperationResult<string>.Succeeded("DefenseTermStudent deleted successfully");
        }
    }
}
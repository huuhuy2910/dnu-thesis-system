using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTermLecturers
{
    public interface IDeleteDefenseTermLecturerCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public class DeleteDefenseTermLecturerCommand : IDeleteDefenseTermLecturerCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteDefenseTermLecturerCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTermLecturers.GetByIdAsync(id);
            if (item == null)
                return OperationResult<string>.Failed("DefenseTermLecturer not found", 404);

            _uow.DefenseTermLecturers.Remove(item);
            await _uow.SaveChangesAsync();
            return OperationResult<string>.Succeeded("DefenseTermLecturer deleted successfully");
        }
    }
}
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerTags
{
    public interface IDeleteLecturerTagCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public class DeleteLecturerTagCommand : IDeleteLecturerTagCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteLecturerTagCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var item = await _uow.LecturerTags.GetByIdAsync(id);
            if (item == null)
                return OperationResult<string>.Failed("LecturerTag not found", 404);

            _uow.LecturerTags.Remove(item);
            await _uow.SaveChangesAsync();
            return OperationResult<string>.Succeeded("LecturerTag deleted successfully");
        }
    }
}

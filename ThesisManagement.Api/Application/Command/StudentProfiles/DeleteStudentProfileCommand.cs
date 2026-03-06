using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.StudentProfiles
{
    public interface IDeleteStudentProfileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(string code);
    }

    public class DeleteStudentProfileCommand : IDeleteStudentProfileCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteStudentProfileCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(string code)
        {
            var entity = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<object?>.Failed("StudentProfile not found", 404);

            _uow.StudentProfiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

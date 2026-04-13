using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.StudentProfiles
{
    public interface IDeleteStudentProfileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(string code);
    }

    public class DeleteStudentProfileCommand : IDeleteStudentProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DeleteStudentProfileCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(string code)
        {
            var entity = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<object?>.Failed("StudentProfile not found", 404);

            await _storageService.DeleteAsync(entity.StudentImage);
            _uow.StudentProfiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

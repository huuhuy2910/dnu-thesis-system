using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.LecturerProfiles
{
    public interface IDeleteLecturerProfileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(string code);
    }

    public class DeleteLecturerProfileCommand : IDeleteLecturerProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DeleteLecturerProfileCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(string code)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<object?>.Failed("LecturerProfile not found", 404);

            await _storageService.DeleteAsync(entity.ProfileImage);
            _uow.LecturerProfiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

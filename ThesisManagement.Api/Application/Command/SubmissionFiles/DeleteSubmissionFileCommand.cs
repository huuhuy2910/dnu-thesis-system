using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.SubmissionFiles
{
    public interface IDeleteSubmissionFileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteSubmissionFileCommand : IDeleteSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DeleteSubmissionFileCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Submission file not found", 404);

            await _storageService.DeleteAsync(entity.FileURL);
            _uow.SubmissionFiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.SubmissionFiles
{
    public interface IDeleteSubmissionFileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteSubmissionFileCommand : IDeleteSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteSubmissionFileCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Submission file not found", 404);

            _uow.SubmissionFiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

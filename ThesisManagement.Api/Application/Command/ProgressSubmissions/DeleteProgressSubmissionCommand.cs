using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressSubmissions
{
    public interface IDeleteProgressSubmissionCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteProgressSubmissionCommand : IDeleteProgressSubmissionCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteProgressSubmissionCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null)
                return OperationResult<object?>.Failed("Submission not found", 404);
            _uow.ProgressSubmissions.Remove(ent);
            await _uow.SaveChangesAsync();
            return OperationResult<object?>.Succeeded(null);
        }
    }
}

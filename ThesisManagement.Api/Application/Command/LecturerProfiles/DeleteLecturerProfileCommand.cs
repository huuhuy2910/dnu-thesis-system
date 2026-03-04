using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerProfiles
{
    public interface IDeleteLecturerProfileCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(string code);
    }

    public class DeleteLecturerProfileCommand : IDeleteLecturerProfileCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteLecturerProfileCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(string code)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<object?>.Failed("LecturerProfile not found", 404);

            _uow.LecturerProfiles.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

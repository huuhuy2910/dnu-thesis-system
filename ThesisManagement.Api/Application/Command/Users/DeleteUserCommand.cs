using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Users
{
    public interface IDeleteUserCommand
    {
        Task<UserCommandResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteUserCommand : IDeleteUserCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteUserCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<UserCommandResult<object?>> ExecuteAsync(int id)
        {
            var user = await _uow.Users.GetByIdAsync(id);
            if (user == null)
                return UserCommandResult<object?>.Failed("User not found", 404);

            _uow.Users.Remove(user);
            await _uow.SaveChangesAsync();

            return UserCommandResult<object?>.Succeeded(null);
        }
    }
}

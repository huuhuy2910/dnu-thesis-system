using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Users
{
    public interface IGetUserUpdateQuery
    {
        Task<UserUpdateDto?> ExecuteAsync(int id);
    }

    public class GetUserUpdateQuery : IGetUserUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetUserUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<UserUpdateDto?> ExecuteAsync(int id)
        {
            var user = await _uow.Users.GetByIdAsync(id);
            return user == null ? null : new UserUpdateDto(user.Role);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.Application.Validate.Users;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Users
{
    public interface IUpdateUserCommand
    {
        Task<UserCommandResult<UserReadDto>> ExecuteAsync(int id, UserUpdateDto dto);
    }

    public class UpdateUserCommand : IUpdateUserCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateUserCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<UserCommandResult<UserReadDto>> ExecuteAsync(int id, UserUpdateDto dto)
        {
            var validationError = UserCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return UserCommandResult<UserReadDto>.Failed(validationError, 400);

            var user = await _uow.Users.GetByIdAsync(id);
            if (user == null)
                return UserCommandResult<UserReadDto>.Failed("User not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Role))
                user.Role = dto.Role.Trim();

            user.LastUpdated = DateTime.UtcNow;

            _uow.Users.Update(user);
            await _uow.SaveChangesAsync();

            return UserCommandResult<UserReadDto>.Succeeded(_mapper.Map<UserReadDto>(user));
        }
    }
}

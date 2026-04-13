using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Validate.Users;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Users
{
    public interface ICreateUserCommand
    {
        Task<UserCommandResult<UserReadDto>> ExecuteAsync(UserCreateDto dto);
    }

    public class CreateUserCommand : ICreateUserCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateUserCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<UserCommandResult<UserReadDto>> ExecuteAsync(UserCreateDto dto)
        {
            var validationError = UserCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return UserCommandResult<UserReadDto>.Failed(validationError, 400);

            var userCode = dto.UserCode.Trim();
            var role = dto.Role.Trim();

            var exists = await _uow.Users.Query()
                .Where(x => x.UserCode == userCode)
                .Select(x => x.UserCode)
                .FirstOrDefaultAsync() != null;
            if (exists)
                return UserCommandResult<UserReadDto>.Failed("Username already exists", 409);

            var user = new User
            {
                UserCode = userCode,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();

            return UserCommandResult<UserReadDto>.Succeeded(_mapper.Map<UserReadDto>(user), 201);
        }
    }
}

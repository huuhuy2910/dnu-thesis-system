using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Auth;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Auth
{
    public sealed record LoginCommandResponse(
        string UserCode,
        string Role,
        string AccessToken,
        string TokenType,
        DateTime ExpiresAt,
        LoginResponseDto Data);

    public interface ILoginCommand
    {
        Task<OperationResult<LoginCommandResponse>> ExecuteAsync(LoginDto loginDto);
    }

    public class LoginCommand : ILoginCommand
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IJwtTokenService _jwtTokenService;

        public LoginCommand(IAuthService authService, ICurrentUserService currentUserService, IJwtTokenService jwtTokenService)
        {
            _authService = authService;
            _currentUserService = currentUserService;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<OperationResult<LoginCommandResponse>> ExecuteAsync(LoginDto loginDto)
        {
            var validationError = LoginCommandValidator.Validate(loginDto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LoginCommandResponse>.Failed(validationError, 400);

            var user = await _authService.ValidateUserAsync(loginDto.Username, loginDto.Password);
            if (user == null)
                return OperationResult<LoginCommandResponse>.Failed("Tên đăng nhập hoặc mật khẩu không đúng", 401);

            _currentUserService.SetCurrentUser(user.UserID, user.UserCode, user.Role);

            var accessToken = _jwtTokenService.GenerateToken(user);
            var expiresAt = _jwtTokenService.GetTokenExpiryUtc();

            var data = new LoginResponseDto(user.UserID, user.UserCode, user.Role, user.CreatedAt);
            var response = new LoginCommandResponse(
                user.UserCode,
                user.Role,
                accessToken,
                "Bearer",
                expiresAt,
                data);

            return OperationResult<LoginCommandResponse>.Succeeded(response);
        }
    }
}

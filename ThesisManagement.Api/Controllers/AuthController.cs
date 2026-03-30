using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Auth;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class AuthController : BaseApiController
    {
        private readonly ILoginCommand _loginCommand;
        private readonly IResetPasswordCommand _resetPasswordCommand;
        private readonly IResetDefaultPasswordCommand _resetDefaultPasswordCommand;

        public AuthController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            ILoginCommand loginCommand,
            IResetPasswordCommand resetPasswordCommand,
            IResetDefaultPasswordCommand resetDefaultPasswordCommand)
            : base(uow, codeGen, mapper)
        {
            _loginCommand = loginCommand;
            _resetPasswordCommand = resetPasswordCommand;
            _resetDefaultPasswordCommand = resetDefaultPasswordCommand;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var result = await _loginCommand.ExecuteAsync(loginDto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(new
            {
                success = true,
                userCode = result.Data!.UserCode,
                role = result.Data.Role,
                accessToken = result.Data.AccessToken,
                tokenType = result.Data.TokenType,
                expiresAt = result.Data.ExpiresAt,
                data = result.Data.Data
            });
        }

        [HttpPost("reset-password")]
        [Authorize]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _resetPasswordCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }

        [HttpPost("reset-password-default")]
        [Authorize]
        public async Task<IActionResult> ResetPasswordDefault([FromBody] ResetDefaultPasswordDto dto)
        {
            var result = await _resetDefaultPasswordCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}

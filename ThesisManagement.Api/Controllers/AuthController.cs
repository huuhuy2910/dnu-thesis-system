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

        public AuthController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper, ILoginCommand loginCommand)
            : base(uow, codeGen, mapper)
        {
            _loginCommand = loginCommand;
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
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class AuthController : BaseApiController
    {
        private readonly IAuthService _authService;

        public AuthController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper, IAuthService authService) 
            : base(uow, codeGen, mapper)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (string.IsNullOrEmpty(loginDto.Username) || string.IsNullOrEmpty(loginDto.Password))
            {
                return BadRequest(ApiResponse<object>.Fail("Username và Password không được để trống", 400));
            }

            var user = await _authService.ValidateUserAsync(loginDto.Username, loginDto.Password);
            
            if (user == null)
            {
                return Unauthorized(ApiResponse<object>.Fail("Tên đăng nhập hoặc mật khẩu không đúng", 401));
            }

            // Return minimal user info as requested (no JWT)
            var payload = new {
                userCode = user.UserCode,
                role = user.Role,
                fullName = user.FullName
            };
            var res = ApiResponse<object>.SuccessResponse(payload);
            res.HttpStatusCode = StatusCodes.Status200OK;
            return Ok(res);
        }
    }
}

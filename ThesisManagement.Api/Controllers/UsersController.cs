using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Users;
using ThesisManagement.Api.Application.Query.Users;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.DTOs.Users.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class UsersController : BaseApiController
    {
        private readonly IGetUsersListQuery _getUsersListQuery;
        private readonly IGetUserDetailQuery _getUserDetailQuery;
        private readonly IGetUserCreateQuery _getUserCreateQuery;
        private readonly IGetUserUpdateQuery _getUserUpdateQuery;
        private readonly ICreateUserCommand _createUserCommand;
        private readonly IUpdateUserCommand _updateUserCommand;
        private readonly IDeleteUserCommand _deleteUserCommand;

        public UsersController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetUsersListQuery getUsersListQuery,
            IGetUserDetailQuery getUserDetailQuery,
            IGetUserCreateQuery getUserCreateQuery,
            IGetUserUpdateQuery getUserUpdateQuery,
            ICreateUserCommand createUserCommand,
            IUpdateUserCommand updateUserCommand,
            IDeleteUserCommand deleteUserCommand) : base(uow, codeGen, mapper)
        {
            _getUsersListQuery = getUsersListQuery;
            _getUserDetailQuery = getUserDetailQuery;
            _getUserCreateQuery = getUserCreateQuery;
            _getUserUpdateQuery = getUserUpdateQuery;
            _createUserCommand = createUserCommand;
            _updateUserCommand = updateUserCommand;
            _deleteUserCommand = deleteUserCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] UserFilter filter)
        {
            var result = await _getUsersListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<UserReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getUserDetailQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));
            return Ok(ApiResponse<UserReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getUserCreateQuery.Execute();
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }
    
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] UserCreateDto dto)
        {
            var result = await _createUserCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<UserReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getUserUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));
            return Ok(ApiResponse<UserUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto dto)
        {
            var result = await _updateUserCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<UserReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteUserCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

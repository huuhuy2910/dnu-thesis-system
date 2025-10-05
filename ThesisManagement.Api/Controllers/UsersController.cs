using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class UsersController : BaseApiController
    {
        public UsersController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] UserFilter filter)
        {
            var result = await _uow.Users.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, 
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(u => _mapper.Map<UserReadDto>(u));
            return Ok(ApiResponse<IEnumerable<UserReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.Users.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));
            return Ok(ApiResponse<UserReadDto>.SuccessResponse(_mapper.Map<UserReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
                        var sample = new { UserCode = "", PasswordHash = "", FullName = "", Email = "", Role = "" };
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] UserCreateDto dto)
        {
            // basic uniqueness check
            var exists = _uow.Users.Query().Any(u => u.UserCode == dto.UserCode);
            if (exists) return Conflict(ApiResponse<object>.Fail("Username already exists", 409));

            var user = new User
            {
                UserCode = dto.UserCode,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password), // simple hashing (add package if needed) - or replace with any hash
                FullName = dto.FullName,
                Email = dto.Email,
                Role = dto.Role,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Users.AddAsync(user);
            await _uow.SaveChangesAsync();

            return StatusCode(201, ApiResponse<UserReadDto>.SuccessResponse(_mapper.Map<UserReadDto>(user), 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Users.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));
            var sample = new UserUpdateDto(ent.FullName, ent.Email, ent.Role);
            return Ok(ApiResponse<UserUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateDto dto)
        {
            var ent = await _uow.Users.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));

            if (!string.IsNullOrWhiteSpace(dto.FullName)) ent.FullName = dto.FullName;
            if (!string.IsNullOrWhiteSpace(dto.Email)) ent.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Role)) ent.Role = dto.Role;
            ent.LastUpdated = DateTime.UtcNow;

            _uow.Users.Update(ent);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<UserReadDto>.SuccessResponse(_mapper.Map<UserReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.Users.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("User not found", 404));
            _uow.Users.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

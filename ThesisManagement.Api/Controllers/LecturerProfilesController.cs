using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class LecturerProfilesController : BaseApiController
    {
        public LecturerProfilesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] LecturerProfileFilter filter)
        {
            var result = await _uow.LecturerProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<LecturerProfileReadDto>(x));
            return Ok(ApiResponse<IEnumerable<LecturerProfileReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));
            return Ok(ApiResponse<LecturerProfileReadDto>.SuccessResponse(_mapper.Map<LecturerProfileReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { UserID = 0, DepartmentID = (int?)null, CurrentGuidingCount = 0 }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LecturerProfileCreateDto dto)
        {
            // Resolve UserCode to UserID
            var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
            if (user == null)
                return BadRequest(ApiResponse<object>.Fail("User not found", 400));

            // Resolve DepartmentCode to DepartmentID if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }
            
            var code = _codeGen.Generate("LEC");
            var entity = new LecturerProfile
            {
                LecturerCode = code,
                UserCode = dto.UserCode,
                UserID = user.UserID,
                DepartmentCode = dto.DepartmentCode,
                DepartmentID = department?.DepartmentID,
                Degree = dto.Degree,
                GuideQuota = dto.GuideQuota ?? 10,
                DefenseQuota = dto.DefenseQuota ?? 8,
                CurrentGuidingCount = dto.CurrentGuidingCount,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                ProfileImage = dto.ProfileImage,
                Address = dto.Address,
                Notes = dto.Notes,
                FullName = dto.FullName,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.LecturerProfiles.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<LecturerProfileReadDto>.SuccessResponse(_mapper.Map<LecturerProfileReadDto>(entity),1,201));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var ent = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));
            return Ok(ApiResponse<LecturerProfileUpdateDto>.SuccessResponse(new LecturerProfileUpdateDto(
                ent.DepartmentCode,
                ent.Degree,
                ent.GuideQuota,
                ent.DefenseQuota,
                ent.CurrentGuidingCount,
                ent.Gender,
                ent.DateOfBirth,
                ent.Email,
                ent.PhoneNumber,
                ent.ProfileImage,
                ent.Address,
                ent.Notes,
                ent.FullName)));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] LecturerProfileUpdateDto dto)
        {
            var ent = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));
            // Resolve DepartmentCode to DepartmentID if provided
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                var department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                ent.DepartmentCode = dto.DepartmentCode;
                ent.DepartmentID = department?.DepartmentID;
            }
            
            ent.Degree = dto.Degree;
            ent.GuideQuota = dto.GuideQuota ?? ent.GuideQuota;
            ent.DefenseQuota = dto.DefenseQuota ?? ent.DefenseQuota;
            ent.CurrentGuidingCount = dto.CurrentGuidingCount ?? ent.CurrentGuidingCount;
            if (dto.Gender != null) ent.Gender = dto.Gender;
            if (dto.DateOfBirth.HasValue) ent.DateOfBirth = dto.DateOfBirth;
            if (dto.Email != null) ent.Email = dto.Email;
            if (dto.PhoneNumber != null) ent.PhoneNumber = dto.PhoneNumber;
            if (dto.ProfileImage != null) ent.ProfileImage = dto.ProfileImage;
            if (dto.Address != null) ent.Address = dto.Address;
            if (dto.Notes != null) ent.Notes = dto.Notes;
            if (dto.FullName != null) ent.FullName = dto.FullName;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.LecturerProfiles.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<LecturerProfileReadDto>.SuccessResponse(_mapper.Map<LecturerProfileReadDto>(ent)));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var ent = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));
            _uow.LecturerProfiles.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

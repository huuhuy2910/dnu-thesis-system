using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class StudentProfilesController : BaseApiController
    {
        public StudentProfilesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] StudentProfileFilter filter)
        {
            var result = await _uow.StudentProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<StudentProfileReadDto>(x));
            return Ok(ApiResponse<IEnumerable<StudentProfileReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { UserID = 0, DepartmentID = (int?)null }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] StudentProfileCreateDto dto)
        {
            // Generate StudentCode
            var code = _codeGen.Generate("STU");
            // Resolve User by Code
            var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
            if (user == null) return BadRequest(ApiResponse<object>.Fail("User not found", 400));
            
            // Resolve Department by Code if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }
            
            var entity = new StudentProfile
            {
                StudentCode = code,
                UserCode = dto.UserCode,
                UserID = user.UserID,
                DepartmentCode = dto.DepartmentCode,
                DepartmentID = department?.DepartmentID,
                ClassCode = dto.ClassCode,
                FacultyCode = dto.FacultyCode,
                StudentImage = dto.StudentImage,
                GPA = dto.GPA,
                AcademicStanding = dto.AcademicStanding,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.StudentProfiles.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(entity),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.StudentProfiles.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            return Ok(ApiResponse<StudentProfileUpdateDto>.SuccessResponse(new StudentProfileUpdateDto(ent.DepartmentCode, ent.ClassCode, ent.FacultyCode, ent.StudentImage, ent.GPA ?? 0, ent.AcademicStanding)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] StudentProfileUpdateDto dto)
        {
            var ent = await _uow.StudentProfiles.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            
            // Resolve Department by Code if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }
            
            ent.DepartmentCode = dto.DepartmentCode;
            ent.DepartmentID = department?.DepartmentID;
            ent.ClassCode = dto.ClassCode;
            ent.FacultyCode = dto.FacultyCode;
            ent.StudentImage = dto.StudentImage;
            ent.GPA = dto.GPA;
            ent.AcademicStanding = dto.AcademicStanding;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.StudentProfiles.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<StudentProfileReadDto>.SuccessResponse(_mapper.Map<StudentProfileReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.StudentProfiles.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("StudentProfile not found", 404));
            _uow.StudentProfiles.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class DepartmentsController : BaseApiController
    {
        public DepartmentsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DepartmentFilter filter)
        {
            var result = await _uow.Departments.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, 
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(d => _mapper.Map<DepartmentReadDto>(d));
            return Ok(ApiResponse<IEnumerable<DepartmentReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.Departments.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));
            return Ok(ApiResponse<DepartmentReadDto>.SuccessResponse(_mapper.Map<DepartmentReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            // Return sample form model (defaults)
            var sample = new { Name = "", Description = "" };
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DepartmentCreateDto dto)
        {
            var ent = new Department
            {
                Name = dto.Name,
                Description = dto.Description,
                DepartmentCode = _codeGen.Generate("DEP"), // generated code
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Departments.AddAsync(ent);
            await _uow.SaveChangesAsync();

            var read = _mapper.Map<DepartmentReadDto>(ent);
            return StatusCode(201, ApiResponse<DepartmentReadDto>.SuccessResponse(read, 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Departments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));
            var sample = new DepartmentUpdateDto(ent.Name, ent.Description);
            return Ok(ApiResponse<DepartmentUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentUpdateDto dto)
        {
            var ent = await _uow.Departments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));

            if (!string.IsNullOrWhiteSpace(dto.Name)) ent.Name = dto.Name;
            ent.Description = dto.Description;
            ent.LastUpdated = DateTime.UtcNow;

            _uow.Departments.Update(ent);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<DepartmentReadDto>.SuccessResponse(_mapper.Map<DepartmentReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.Departments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));
            _uow.Departments.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

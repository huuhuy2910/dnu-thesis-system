using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class SpecialtiesController : BaseApiController
    {
        public SpecialtiesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] SpecialtyFilter filter)
        {
            var result = await _uow.Specialties.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<SpecialtyReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SpecialtyReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.Specialties.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Specialty not found", 404));
            return Ok(ApiResponse<SpecialtyReadDto>.SuccessResponse(_mapper.Map<SpecialtyReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { Name = "", Description = "" }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] SpecialtyCreateDto dto)
        {
            var ent = new Specialty
            {
                SpecialtyCode = _codeGen.Generate("SP"),
                Name = dto.Name,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Specialties.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<SpecialtyReadDto>.SuccessResponse(_mapper.Map<SpecialtyReadDto>(ent)));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Specialties.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Specialty not found", 404));
            return Ok(ApiResponse<SpecialtyUpdateDto>.SuccessResponse(new SpecialtyUpdateDto(ent.Name, ent.Description)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SpecialtyUpdateDto dto)
        {
            var ent = await _uow.Specialties.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Specialty not found", 404));

            if (!string.IsNullOrEmpty(dto.Name)) ent.Name = dto.Name;
            if (dto.Description != null) ent.Description = dto.Description;
            ent.LastUpdated = DateTime.UtcNow;

            _uow.Specialties.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<SpecialtyReadDto>.SuccessResponse(_mapper.Map<SpecialtyReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.Specialties.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Specialty not found", 404));

            _uow.Specialties.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}
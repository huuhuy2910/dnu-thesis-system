using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class CatalogTopicSpecialtiesController : BaseApiController
    {
        public CatalogTopicSpecialtiesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CatalogTopicSpecialtyFilter filter)
        {
            var result = await _uow.CatalogTopicSpecialties.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) =>
                {
                    var q = query;
                    if (f.CatalogTopicID.HasValue) q = q.Where(x => EF.Property<int>(x, "CatalogTopicID") == f.CatalogTopicID.Value);
                    if (f.SpecialtyID.HasValue) q = q.Where(x => EF.Property<int>(x, "SpecialtyID") == f.SpecialtyID.Value);
                    if (!string.IsNullOrWhiteSpace(f.CatalogTopicCode)) q = q.Where(x => EF.Property<string>(x, "CatalogTopicCode") == f.CatalogTopicCode);
                    if (!string.IsNullOrWhiteSpace(f.SpecialtyCode)) q = q.Where(x => EF.Property<string>(x, "SpecialtyCode") == f.SpecialtyCode);
                    if (f.CreatedFrom.HasValue) q = q.Where(x => EF.Property<DateTime>(x, "CreatedAt") >= f.CreatedFrom.Value);
                    if (f.CreatedTo.HasValue) q = q.Where(x => EF.Property<DateTime>(x, "CreatedAt") <= f.CreatedTo.Value);
                    return q;
                });
            var dtos = result.Items.Select(x => _mapper.Map<CatalogTopicSpecialtyReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicSpecialtyReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{catalogTopicId}/{specialtyId}")]
        public async Task<IActionResult> GetDetail(int catalogTopicId, int specialtyId)
        {
            var ent = await _uow.CatalogTopicSpecialties.GetByIdAsync(catalogTopicId, specialtyId);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopicSpecialty not found", 404));
            return Ok(ApiResponse<CatalogTopicSpecialtyReadDto>.SuccessResponse(_mapper.Map<CatalogTopicSpecialtyReadDto>(ent)));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CatalogTopicSpecialtyCreateDto dto)
        {
            // Try to resolve codes if not provided
            string? catalogCode = dto.CatalogTopicCode;
            string? specialtyCode = dto.SpecialtyCode;
            if (string.IsNullOrWhiteSpace(catalogCode))
            {
                var ct = await _uow.CatalogTopics.GetByIdAsync(dto.CatalogTopicID);
                catalogCode = ct?.CatalogTopicCode;
            }
            if (string.IsNullOrWhiteSpace(specialtyCode))
            {
                var sp = await _uow.Specialties.GetByIdAsync(dto.SpecialtyID);
                specialtyCode = sp?.SpecialtyCode;
            }

            var ent = new CatalogTopicSpecialty
            {
                CatalogTopicID = dto.CatalogTopicID,
                SpecialtyID = dto.SpecialtyID,
                CatalogTopicCode = catalogCode,
                SpecialtyCode = specialtyCode,
                CreatedAt = DateTime.UtcNow
            };
            await _uow.CatalogTopicSpecialties.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<CatalogTopicSpecialtyReadDto>.SuccessResponse(_mapper.Map<CatalogTopicSpecialtyReadDto>(ent),1,201));
        }

        [HttpPut("update/{catalogTopicId}/{specialtyId}")]
        public async Task<IActionResult> Update(int catalogTopicId, int specialtyId, [FromBody] CatalogTopicSpecialtyUpdateDto dto)
        {
            var ent = await _uow.CatalogTopicSpecialties.GetByIdAsync(catalogTopicId, specialtyId);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopicSpecialty not found", 404));
            if (dto.CreatedAt.HasValue) ent.CreatedAt = dto.CreatedAt.Value;
            if (!string.IsNullOrWhiteSpace(dto.CatalogTopicCode)) ent.CatalogTopicCode = dto.CatalogTopicCode;
            if (!string.IsNullOrWhiteSpace(dto.SpecialtyCode)) ent.SpecialtyCode = dto.SpecialtyCode;
            _uow.CatalogTopicSpecialties.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<CatalogTopicSpecialtyReadDto>.SuccessResponse(_mapper.Map<CatalogTopicSpecialtyReadDto>(ent)));
        }

        [HttpDelete("delete/{catalogTopicId}/{specialtyId}")]
        public async Task<IActionResult> Delete(int catalogTopicId, int specialtyId)
        {
            await _uow.CatalogTopicSpecialties.RemoveByIdAsync(catalogTopicId, specialtyId);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

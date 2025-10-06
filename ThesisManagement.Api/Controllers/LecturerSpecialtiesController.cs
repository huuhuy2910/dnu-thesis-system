using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class LecturerSpecialtiesController : BaseApiController
    {
        public LecturerSpecialtiesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] LecturerSpecialtyFilter filter)
        {
            var result = await _uow.LecturerSpecialties.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<LecturerSpecialtyReadDto>(x));
            return Ok(ApiResponse<IEnumerable<LecturerSpecialtyReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{lecturerProfileId}/{specialtyId}")]
        public async Task<IActionResult> GetDetail(int lecturerProfileId, int specialtyId)
        {
            var item = await _uow.LecturerSpecialties.Query()
                .FirstOrDefaultAsync(x => x.LecturerProfileID == lecturerProfileId && x.SpecialtyID == specialtyId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("LecturerSpecialty not found", 404));
            return Ok(ApiResponse<LecturerSpecialtyReadDto>.SuccessResponse(_mapper.Map<LecturerSpecialtyReadDto>(item)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { LecturerProfileID = 0, SpecialtyID = 0 }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LecturerSpecialtyCreateDto dto)
        {
            var lecturerProfile = await _uow.LecturerProfiles.GetByIdAsync(dto.LecturerProfileID);
            if (lecturerProfile == null) return NotFound(ApiResponse<object>.Fail("LecturerProfile not found", 404));

            var specialty = await _uow.Specialties.GetByIdAsync(dto.SpecialtyID);
            if (specialty == null) return NotFound(ApiResponse<object>.Fail("Specialty not found", 404));

            var ent = new LecturerSpecialty
            {
                LecturerProfileID = dto.LecturerProfileID,
                SpecialtyID = dto.SpecialtyID,
                LecturerCode = lecturerProfile.LecturerCode,
                SpecialtyCode = specialty.SpecialtyCode,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.LecturerSpecialties.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<LecturerSpecialtyReadDto>.SuccessResponse(_mapper.Map<LecturerSpecialtyReadDto>(ent)));
        }

        [HttpDelete("delete/{lecturerProfileId}/{specialtyId}")]
        public async Task<IActionResult> Delete(int lecturerProfileId, int specialtyId)
        {
            var item = await _uow.LecturerSpecialties.Query()
                .FirstOrDefaultAsync(x => x.LecturerProfileID == lecturerProfileId && x.SpecialtyID == specialtyId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("LecturerSpecialty not found", 404));

            _uow.LecturerSpecialties.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        [HttpGet("by-lecturer/{lecturerProfileId}")]
        public async Task<IActionResult> GetByLecturer(int lecturerProfileId)
        {
            var items = await _uow.LecturerSpecialties.Query()
                .Where(x => x.LecturerProfileID == lecturerProfileId)
                .ToListAsync();
            var dtos = items.Select(x => _mapper.Map<LecturerSpecialtyReadDto>(x));
            return Ok(ApiResponse<IEnumerable<LecturerSpecialtyReadDto>>.SuccessResponse(dtos, items.Count));
        }

        [HttpGet("by-specialty/{specialtyId}")]
        public async Task<IActionResult> GetBySpecialty(int specialtyId)
        {
            var items = await _uow.LecturerSpecialties.Query()
                .Where(x => x.SpecialtyID == specialtyId)
                .ToListAsync();
            var dtos = items.Select(x => _mapper.Map<LecturerSpecialtyReadDto>(x));
            return Ok(ApiResponse<IEnumerable<LecturerSpecialtyReadDto>>.SuccessResponse(dtos, items.Count));
        }
    }
}
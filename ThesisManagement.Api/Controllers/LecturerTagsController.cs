using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class LecturerTagsController : BaseApiController
    {
        public LecturerTagsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] LecturerTagFilter filter)
        {
            var result = await _uow.LecturerTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<LecturerTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<LecturerTagReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new LecturerTagCreateDto(
                LecturerProfileID: 0,
                LecturerCode: null,
                TagID: 0,
                TagCode: null,
                AssignedAt: DateTime.UtcNow,
                AssignedByUserID: null,
                AssignedByUserCode: null
            );
            return Ok(ApiResponse<LecturerTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LecturerTagCreateDto dto)
        {
            // Auto-resolve IDs from codes if needed
            int lecturerProfileID = dto.LecturerProfileID;
            if (lecturerProfileID == 0 && !string.IsNullOrWhiteSpace(dto.LecturerCode))
            {
                var lecturer = await _uow.LecturerProfiles.Query()
                    .Where(x => x.LecturerCode == dto.LecturerCode)
                    .FirstOrDefaultAsync();
                if (lecturer == null)
                    return NotFound(ApiResponse<object>.Fail($"LecturerProfile with code '{dto.LecturerCode}' not found", 404));
                lecturerProfileID = lecturer.LecturerProfileID;
            }

            int tagID = dto.TagID;
            if (tagID == 0 && !string.IsNullOrWhiteSpace(dto.TagCode))
            {
                var tag = await _uow.Tags.Query()
                    .Where(x => x.TagCode == dto.TagCode)
                    .FirstOrDefaultAsync();
                if (tag == null)
                    return NotFound(ApiResponse<object>.Fail($"Tag with code '{dto.TagCode}' not found", 404));
                tagID = tag.TagID;
            }

            // Check for duplicate (UNIQUE constraint)
            var existing = await _uow.LecturerTags.Query()
                .Where(x => x.LecturerProfileID == lecturerProfileID && x.TagID == tagID)
                .FirstOrDefaultAsync();
            if (existing != null)
                return BadRequest(ApiResponse<object>.Fail("This lecturer already has this tag assigned", 400));

            var ent = new LecturerTag
            {
                LecturerProfileID = lecturerProfileID,
                LecturerCode = dto.LecturerCode,
                TagID = tagID,
                TagCode = dto.TagCode,
                AssignedAt = dto.AssignedAt ?? DateTime.UtcNow,
                AssignedByUserID = dto.AssignedByUserID,
                AssignedByUserCode = dto.AssignedByUserCode
            };

            await _uow.LecturerTags.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<LecturerTagReadDto>.SuccessResponse(_mapper.Map<LecturerTagReadDto>(ent)));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var item = await _uow.LecturerTags.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("LecturerTag not found", 404));

            var sample = new LecturerTagUpdateDto(
                LecturerProfileID: item.LecturerProfileID,
                LecturerCode: item.LecturerCode,
                TagID: item.TagID,
                TagCode: item.TagCode,
                AssignedAt: item.AssignedAt,
                AssignedByUserID: item.AssignedByUserID,
                AssignedByUserCode: item.AssignedByUserCode
            );
            return Ok(ApiResponse<LecturerTagUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LecturerTagUpdateDto dto)
        {
            var ent = await _uow.LecturerTags.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("LecturerTag not found", 404));

            // Update fields
            if (dto.LecturerProfileID.HasValue) ent.LecturerProfileID = dto.LecturerProfileID.Value;
            if (dto.LecturerCode is not null) ent.LecturerCode = dto.LecturerCode;
            if (dto.TagID.HasValue) ent.TagID = dto.TagID.Value;
            if (dto.TagCode is not null) ent.TagCode = dto.TagCode;
            if (dto.AssignedAt.HasValue) ent.AssignedAt = dto.AssignedAt.Value;
            if (dto.AssignedByUserID.HasValue) ent.AssignedByUserID = dto.AssignedByUserID.Value;
            if (dto.AssignedByUserCode is not null) ent.AssignedByUserCode = dto.AssignedByUserCode;

            _uow.LecturerTags.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<LecturerTagReadDto>.SuccessResponse(_mapper.Map<LecturerTagReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _uow.LecturerTags.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("LecturerTag not found", 404));

            _uow.LecturerTags.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse("LecturerTag deleted successfully"));
        }

        [HttpGet("by-lecturer/{lecturerCode}")]
        public async Task<IActionResult> GetByLecturer(string lecturerCode)
        {
            var items = await _uow.LecturerTags.Query()
                .Where(x => x.LecturerCode == lecturerCode)
                .Include(x => x.Tag)
                .Include(x => x.AssignedByUser)
                .ToListAsync();
            return Ok(ApiResponse<List<LecturerTagReadDto>>.SuccessResponse(_mapper.Map<List<LecturerTagReadDto>>(items)));
        }

        [HttpGet("by-tag/{tagId}")]
        public async Task<IActionResult> GetByTag(int tagId)
        {
            var items = await _uow.LecturerTags.Query()
                .Where(x => x.TagID == tagId)
                .Include(x => x.LecturerProfile)
                .Include(x => x.AssignedByUser)
                .ToListAsync();
            return Ok(ApiResponse<List<LecturerTagReadDto>>.SuccessResponse(_mapper.Map<List<LecturerTagReadDto>>(items)));
        }
    }
}

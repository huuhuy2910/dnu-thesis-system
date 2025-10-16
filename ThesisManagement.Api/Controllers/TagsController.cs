using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TagsController : BaseApiController
    {
        public TagsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] TagFilter filter)
        {
            var result = await _uow.Tags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<TagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TagReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var code = await GenerateTagCodeAsync();
            var sample = new TagCreateDto(
                TagCode: code,
                TagName: string.Empty,
                Description: null
            );
            return Ok(ApiResponse<TagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TagCreateDto dto)
        {
            var code = string.IsNullOrWhiteSpace(dto.TagCode)
                ? await GenerateTagCodeAsync()
                : dto.TagCode;

            // Check for duplicate code
            var existing = await _uow.Tags.Query()
                .Where(x => x.TagCode == code)
                .FirstOrDefaultAsync();
            if (existing != null)
                return BadRequest(ApiResponse<object>.Fail($"Tag with code '{code}' already exists", 400));

            var ent = new Tag
            {
                TagCode = code,
                TagName = dto.TagName,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.Tags.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TagReadDto>.SuccessResponse(_mapper.Map<TagReadDto>(ent)));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var item = await _uow.Tags.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));

            var sample = new TagUpdateDto(
                TagName: item.TagName,
                Description: item.Description
            );
            return Ok(ApiResponse<TagUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TagUpdateDto dto)
        {
            var ent = await _uow.Tags.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));

            if (!string.IsNullOrWhiteSpace(dto.TagName)) ent.TagName = dto.TagName;
            if (dto.Description is not null) ent.Description = dto.Description;

            _uow.Tags.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TagReadDto>.SuccessResponse(_mapper.Map<TagReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _uow.Tags.GetByIdAsync(id);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));

            // Check if tag is being used
            var usedInCatalogTopics = await _uow.CatalogTopicTags.Query().AnyAsync(x => x.TagID == id);
            var usedInTopics = await _uow.TopicTags.Query().AnyAsync(x => x.TagID == id);
            var usedInLecturers = await _uow.LecturerTags.Query().AnyAsync(x => x.TagID == id);

            if (usedInCatalogTopics || usedInTopics || usedInLecturers)
                return BadRequest(ApiResponse<object>.Fail("Cannot delete tag because it is being used", 400));

            _uow.Tags.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<string>.SuccessResponse("Tag deleted successfully"));
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
                return Ok(ApiResponse<List<TagReadDto>>.SuccessResponse(new List<TagReadDto>()));

            var items = await _uow.Tags.Query()
                .Where(x => x.TagName.Contains(q) || x.TagCode.Contains(q))
                .OrderBy(x => x.TagName)
                .Take(20)
                .ToListAsync();

            return Ok(ApiResponse<List<TagReadDto>>.SuccessResponse(_mapper.Map<List<TagReadDto>>(items)));
        }

        [HttpGet("get-by-code/{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var item = await _uow.Tags.Query()
                .FirstOrDefaultAsync(x => x.TagCode == code);
            if (item == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));
            return Ok(ApiResponse<TagReadDto>.SuccessResponse(_mapper.Map<TagReadDto>(item)));
        }

        private async Task<string> GenerateTagCodeAsync()
        {
            var today = DateTime.Now;
            var prefix = $"TAG{today:yyyyMMdd}";
            var lastCode = await _uow.Tags.Query()
                .Where(x => x.TagCode.StartsWith(prefix))
                .OrderByDescending(x => x.TagCode)
                .Select(x => x.TagCode)
                .FirstOrDefaultAsync();

            if (lastCode == null)
                return $"{prefix}001";

            var lastNumber = int.Parse(lastCode.Substring(prefix.Length));
            return $"{prefix}{(lastNumber + 1):D3}";
        }
    }
}

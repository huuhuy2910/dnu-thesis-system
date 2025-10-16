using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class CatalogTopicTagsController : BaseApiController
    {
        public CatalogTopicTagsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] CatalogTopicTagFilter filter)
        {
            var result = await _uow.CatalogTopicTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new CatalogTopicTagCreateDto(null, null, null, null);
            return Ok(ApiResponse<CatalogTopicTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CatalogTopicTagCreateDto dto)
        {
            // Resolve CatalogTopicID from CatalogTopicCode if needed
            int catalogTopicId = dto.CatalogTopicID ?? 0;
            if (catalogTopicId == 0 && !string.IsNullOrEmpty(dto.CatalogTopicCode))
            {
                var catalogTopic = await _uow.CatalogTopics.Query()
                    .FirstOrDefaultAsync(ct => ct.CatalogTopicCode == dto.CatalogTopicCode);
                if (catalogTopic != null)
                {
                    catalogTopicId = catalogTopic.CatalogTopicID;
                }
                else
                {
                    return NotFound(ApiResponse<object>.Fail($"CatalogTopic with code '{dto.CatalogTopicCode}' not found", 404));
                }
            }

            // Resolve TagID from TagCode if needed
            int tagId = dto.TagID ?? 0;
            if (tagId == 0 && !string.IsNullOrEmpty(dto.TagCode))
            {
                var tag = await _uow.Tags.Query()
                    .FirstOrDefaultAsync(t => t.TagCode == dto.TagCode);
                if (tag != null)
                {
                    tagId = tag.TagID;
                }
                else
                {
                    return NotFound(ApiResponse<object>.Fail($"Tag with code '{dto.TagCode}' not found", 404));
                }
            }

            if (catalogTopicId == 0 || tagId == 0)
            {
                return BadRequest(ApiResponse<object>.Fail("CatalogTopicID and TagID are required"));
            }

            // Check for duplicate
            var exists = await _uow.CatalogTopicTags.Query()
                .AnyAsync(ctt => ctt.CatalogTopicID == catalogTopicId && ctt.TagID == tagId);
            if (exists)
            {
                return BadRequest(ApiResponse<object>.Fail("This catalog topic-tag relationship already exists"));
            }

            var catalogTopicTag = new CatalogTopicTag
            {
                CatalogTopicID = catalogTopicId,
                TagID = tagId,
                CatalogTopicCode = dto.CatalogTopicCode,
                TagCode = dto.TagCode,
                CreatedAt = DateTime.Now
            };

            await _uow.CatalogTopicTags.AddAsync(catalogTopicTag);
            await _uow.SaveChangesAsync();

            var resultDto = _mapper.Map<CatalogTopicTagReadDto>(catalogTopicTag);
            return Ok(ApiResponse<CatalogTopicTagReadDto>.SuccessResponse(resultDto));
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> Delete([FromQuery] int catalogTopicId, [FromQuery] int tagId)
        {
            var catalogTopicTag = await _uow.CatalogTopicTags.Query()
                .FirstOrDefaultAsync(ctt => ctt.CatalogTopicID == catalogTopicId && ctt.TagID == tagId);

            if (catalogTopicTag == null)
            {
                return NotFound(ApiResponse<object>.Fail("CatalogTopicTag not found", 404));
            }

            _uow.CatalogTopicTags.Remove(catalogTopicTag);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<string>.SuccessResponse("CatalogTopicTag deleted successfully"));
        }

        [HttpGet("by-catalog-topic/{catalogTopicId}")]
        public async Task<IActionResult> GetByCatalogTopic(int catalogTopicId)
        {
            var catalogTopicTags = await _uow.CatalogTopicTags.Query()
                .Where(ctt => ctt.CatalogTopicID == catalogTopicId)
                .ToListAsync();

            var dtos = catalogTopicTags.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-tag/{tagId}")]
        public async Task<IActionResult> GetByTag(int tagId)
        {
            var catalogTopicTags = await _uow.CatalogTopicTags.Query()
                .Where(ctt => ctt.TagID == tagId)
                .ToListAsync();

            var dtos = catalogTopicTags.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-catalog-topic-code/{catalogTopicCode}")]
        public async Task<IActionResult> GetByCatalogTopicCode(string catalogTopicCode)
        {
            var catalogTopicTags = await _uow.CatalogTopicTags.Query()
                .Where(ctt => ctt.CatalogTopicCode == catalogTopicCode)
                .ToListAsync();

            var dtos = catalogTopicTags.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-tag-code/{tagCode}")]
        public async Task<IActionResult> GetByTagCode(string tagCode)
        {
            var catalogTopicTags = await _uow.CatalogTopicTags.Query()
                .Where(ctt => ctt.TagCode == tagCode)
                .ToListAsync();

            var dtos = catalogTopicTags.Select(x => _mapper.Map<CatalogTopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicTagReadDto>>.SuccessResponse(dtos));
        }
    }
}

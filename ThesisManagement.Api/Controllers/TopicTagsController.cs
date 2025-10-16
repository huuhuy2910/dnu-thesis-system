using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TopicTagsController : BaseApiController
    {
        public TopicTagsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] TopicTagFilter filter)
        {
            var result = await _uow.TopicTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<TopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new TopicTagCreateDto(null, null, null, null);
            return Ok(ApiResponse<TopicTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicTagCreateDto dto)
        {
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

            // Resolve CatalogTopicCode from TopicCode if provided
            string? catalogTopicCode = dto.CatalogTopicCode;
            string? topicCode = dto.TopicCode;

            if (string.IsNullOrWhiteSpace(catalogTopicCode) && !string.IsNullOrWhiteSpace(topicCode))
            {
                var topic = await _uow.Topics.Query()
                    .FirstOrDefaultAsync(t => t.TopicCode == topicCode);
                if (topic != null)
                {
                    catalogTopicCode = topic.CatalogTopicCode;
                }
                else
                {
                    return NotFound(ApiResponse<object>.Fail($"Topic with code '{topicCode}' not found", 404));
                }
            }

            // Only require TagID - CatalogTopicCode can be null
            if (tagId == 0)
                return BadRequest(ApiResponse<object>.Fail("TagID (or TagCode) is required"));

            var topicTag = new TopicTag
            {
                TagID = tagId,
                TagCode = dto.TagCode,
                CatalogTopicCode = catalogTopicCode,
                TopicCode = dto.TopicCode,
                CreatedAt = DateTime.Now
            };

            await _uow.TopicTags.AddAsync(topicTag);
            await _uow.SaveChangesAsync();

            var resultDto = _mapper.Map<TopicTagReadDto>(topicTag);
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(resultDto));
        }


        [HttpGet("by-topic/{topicCode}")]
        public async Task<IActionResult> GetByTopic(string topicCode)
        {
            var list = await _uow.TopicTags.Query().Where(x => x.TopicCode == topicCode).ToListAsync();
            var dtos = list.Select(x => _mapper.Map<TopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-catalog-topic/{catalogTopicCode}")]
        public async Task<IActionResult> GetByCatalogTopic(string catalogTopicCode)
        {
            var list = await _uow.TopicTags.Query().Where(x => x.CatalogTopicCode == catalogTopicCode).ToListAsync();
            var dtos = list.Select(x => _mapper.Map<TopicTagReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(dtos));
        }

        

        // New endpoints with topicCode in route
        [HttpPost("create/{topicCode}")]
        public async Task<IActionResult> CreateByTopicCode(string topicCode, [FromBody] TopicTagCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(topicCode))
                return BadRequest(ApiResponse<object>.Fail("TopicCode is required"));

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

            if (tagId == 0)
                return BadRequest(ApiResponse<object>.Fail("TagID or TagCode is required"));

            // Validate Topic exists and get CatalogTopicCode
            var topic = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode == topicCode);
            if (topic == null)
                return NotFound(ApiResponse<object>.Fail($"Topic with code '{topicCode}' not found", 404));

            // Check duplicate
            var exists = await _uow.TopicTags.Query()
                .AnyAsync(tt => tt.TopicCode == topicCode && tt.TagID == tagId);
            if (exists)
                return BadRequest(ApiResponse<object>.Fail("This TopicTag already exists"));

            var topicTag = new TopicTag
            {
                TagID = tagId,
                TagCode = dto.TagCode,
                CatalogTopicCode = topic.CatalogTopicCode,
                TopicCode = topicCode,
                CreatedAt = DateTime.Now
            };

            await _uow.TopicTags.AddAsync(topicTag);
            await _uow.SaveChangesAsync();

            var resultDto = _mapper.Map<TopicTagReadDto>(topicTag);
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(resultDto));
        }

        [HttpGet("get-update/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> GetUpdateByTopicCode(string topicCode, int topicTagID)
        {
            var entity = await _uow.TopicTags.Query()
                .FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagID && tt.TopicCode == topicCode);

            if (entity == null)
                return NotFound(ApiResponse<object>.Fail("TopicTag not found", 404));

            var dto = _mapper.Map<TopicTagReadDto>(entity);
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> UpdateByTopicCode(string topicCode, int topicTagID, [FromBody] TopicTagUpdateDto dto)
        {
            var entity = await _uow.TopicTags.Query()
                .FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagID && tt.TopicCode == topicCode);

            if (entity == null)
                return NotFound(ApiResponse<object>.Fail("TopicTag not found", 404));

            // Update TagID if provided
            if (dto.TagID.HasValue && dto.TagID.Value > 0)
            {
                entity.TagID = dto.TagID.Value;
                
                // Resolve TagCode from new TagID
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(t => t.TagID == dto.TagID.Value);
                if (tag != null)
                    entity.TagCode = tag.TagCode;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TagCode))
            {
                // Resolve TagID from TagCode
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(t => t.TagCode == dto.TagCode);
                if (tag != null)
                {
                    entity.TagID = tag.TagID;
                    entity.TagCode = tag.TagCode;
                }
                else
                {
                    return NotFound(ApiResponse<object>.Fail($"Tag with code '{dto.TagCode}' not found", 404));
                }
            }

            _uow.TopicTags.Update(entity);
            await _uow.SaveChangesAsync();

            var resultDto = _mapper.Map<TopicTagReadDto>(entity);
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(resultDto));
        }

        [HttpDelete("delete/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> DeleteByTopicCode(string topicCode, int topicTagID)
        {
            var entity = await _uow.TopicTags.Query()
                .FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagID && tt.TopicCode == topicCode);

            if (entity == null)
                return NotFound(ApiResponse<object>.Fail("TopicTag not found", 404));

            _uow.TopicTags.Remove(entity);
            await _uow.SaveChangesAsync();

            return Ok(ApiResponse<string>.SuccessResponse("TopicTag deleted successfully"));
        }
    }
}

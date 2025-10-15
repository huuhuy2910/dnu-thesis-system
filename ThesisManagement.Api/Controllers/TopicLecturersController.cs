using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class TopicLecturersController : BaseApiController
    {
        public TopicLecturersController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] TopicLecturerFilter filter)
        {
            var result = await _uow.TopicLecturers.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<TopicLecturerReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> GetDetail(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));
            return Ok(ApiResponse<TopicLecturerReadDto>.SuccessResponse(_mapper.Map<TopicLecturerReadDto>(item)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new TopicLecturerCreateDto(
                TopicID: null,
                TopicCode: null,
                LecturerProfileID: null,
                LecturerCode: null,
                IsPrimary: false,
                CreatedAt: DateTime.UtcNow);
            return Ok(ApiResponse<TopicLecturerCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicLecturerCreateDto dto)
        {
            // Resolve TopicID from TopicCode if not provided
            int topicId;
            string? topicCode;
            Topic? topicEntity = null;
            if (dto.TopicID.HasValue)
            {
                topicId = dto.TopicID.Value;
                topicCode = dto.TopicCode;
                topicEntity = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicID == topicId);
                if (topicEntity == null)
                    return BadRequest(ApiResponse<object>.Fail("Topic not found", 400));
            }
            else if (!string.IsNullOrWhiteSpace(dto.TopicCode))
            {
                topicEntity = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode.Trim() == dto.TopicCode.Trim());
                if (topicEntity == null)
                    return BadRequest(ApiResponse<object>.Fail("Topic not found", 400));
                topicId = topicEntity.TopicID;
                topicCode = topicEntity.TopicCode;
            }
            else
            {
                return BadRequest(ApiResponse<object>.Fail("Either TopicID or TopicCode must be provided", 400));
            }

            // Resolve LecturerProfileID from LecturerCode if not provided
            int lecturerProfileId;
            string? lecturerCode;
            LecturerProfile? lecturerEntity = null;
            if (dto.LecturerProfileID.HasValue)
            {
                lecturerProfileId = dto.LecturerProfileID.Value;
                lecturerCode = dto.LecturerCode;
                lecturerEntity = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerProfileID == lecturerProfileId);
                if (lecturerEntity == null)
                    return BadRequest(ApiResponse<object>.Fail("Lecturer profile not found", 400));
            }
            else if (!string.IsNullOrWhiteSpace(dto.LecturerCode))
            {
                lecturerEntity = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerCode.Trim() == dto.LecturerCode.Trim());
                if (lecturerEntity == null)
                    return BadRequest(ApiResponse<object>.Fail("Lecturer profile not found", 400));
                lecturerProfileId = lecturerEntity.LecturerProfileID;
                lecturerCode = lecturerEntity.LecturerCode;
            }
            else
            {
                return BadRequest(ApiResponse<object>.Fail("Either LecturerProfileID or LecturerCode must be provided", 400));
            }
            
            var ent = new TopicLecturer
            {
                TopicID = topicId,
                TopicCode = topicCode,
                LecturerProfileID = lecturerProfileId,
                LecturerCode = lecturerCode,
                IsPrimary = dto.IsPrimary,
                CreatedAt = dto.CreatedAt == default(DateTime) ? DateTime.UtcNow : dto.CreatedAt,
                Topic = topicEntity,
                LecturerProfile = lecturerEntity
            };

            await _uow.TopicLecturers.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TopicLecturerCreateDto>.SuccessResponse(new TopicLecturerCreateDto(
                TopicID: ent.TopicID,
                TopicCode: ent.TopicCode,
                LecturerProfileID: ent.LecturerProfileID,
                LecturerCode: ent.LecturerCode,
                IsPrimary: ent.IsPrimary,
                CreatedAt: ent.CreatedAt)));
        }

        [HttpGet("get-update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> GetUpdate(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));
            return Ok(ApiResponse<TopicLecturerUpdateDto>.SuccessResponse(new TopicLecturerUpdateDto(
                item.TopicID,
                item.TopicCode,
                item.LecturerProfileID,
                item.LecturerCode,
                item.IsPrimary,
                item.CreatedAt)));
        }

        [HttpPut("update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> Update(int topicId, int lecturerProfileId, [FromBody] TopicLecturerUpdateDto dto)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));

            // Update TopicID if provided, else resolve from TopicCode if provided
            if (dto.TopicID.HasValue)
            {
                item.TopicID = dto.TopicID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TopicCode))
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode.Trim() == dto.TopicCode.Trim());
                if (topic == null)
                    return BadRequest(ApiResponse<object>.Fail("Topic not found", 400));
                item.TopicID = topic.TopicID;
                item.TopicCode = topic.TopicCode;
            }

            // Update LecturerProfileID if provided, else resolve from LecturerCode if provided
            if (dto.LecturerProfileID.HasValue)
            {
                item.LecturerProfileID = dto.LecturerProfileID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.LecturerCode))
            {
                var lecturerProfile = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerCode.Trim() == dto.LecturerCode.Trim());
                if (lecturerProfile == null)
                    return BadRequest(ApiResponse<object>.Fail("Lecturer profile not found", 400));
                item.LecturerProfileID = lecturerProfile.LecturerProfileID;
                item.LecturerCode = lecturerProfile.LecturerCode;
            }

            if (dto.IsPrimary.HasValue) item.IsPrimary = dto.IsPrimary.Value;
            if (dto.CreatedAt.HasValue) item.CreatedAt = dto.CreatedAt.Value;

            _uow.TopicLecturers.Update(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TopicLecturerReadDto>.SuccessResponse(_mapper.Map<TopicLecturerReadDto>(item)));
        }

        [HttpDelete("delete/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> Delete(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));

            _uow.TopicLecturers.Remove(item);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        [HttpGet("by-topic/{topicId}")]
        public async Task<IActionResult> GetByTopic(int topicId)
        {
            var items = await _uow.TopicLecturers.Query()
                .Where(x => x.TopicID == topicId)
                .ToListAsync();
            var dtos = items.Select(x => _mapper.Map<TopicLecturerReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(dtos, items.Count));
        }

        [HttpGet("by-lecturer/{lecturerProfileId}")]
        public async Task<IActionResult> GetByLecturer(int lecturerProfileId)
        {
            var items = await _uow.TopicLecturers.Query()
                .Where(x => x.LecturerProfileID == lecturerProfileId)
                .ToListAsync();
            var dtos = items.Select(x => _mapper.Map<TopicLecturerReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(dtos, items.Count));
        }
    }
}
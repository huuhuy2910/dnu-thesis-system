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
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { TopicID = 0, LecturerProfileID = 0, IsPrimary = false }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicLecturerCreateDto dto)
        {
            // Resolve TopicCode to TopicID
            var topic = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode == dto.TopicCode);
            if (topic == null)
                return BadRequest(ApiResponse<object>.Fail("Topic not found", 400));

            // Resolve LecturerCode to LecturerProfileID
            var lecturerProfile = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerCode == dto.LecturerCode);
            if (lecturerProfile == null)
                return BadRequest(ApiResponse<object>.Fail("Lecturer profile not found", 400));
            
            var ent = new TopicLecturer
            {
                TopicID = topic.TopicID,
                TopicCode = topic.TopicCode,
                LecturerProfileID = lecturerProfile.LecturerProfileID,
                LecturerCode = lecturerProfile.LecturerCode,
                IsPrimary = dto.IsPrimary,
                CreatedAt = DateTime.UtcNow
            };

            await _uow.TopicLecturers.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TopicLecturerReadDto>.SuccessResponse(_mapper.Map<TopicLecturerReadDto>(ent)));
        }

        [HttpGet("get-update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> GetUpdate(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));
            return Ok(ApiResponse<TopicLecturerUpdateDto>.SuccessResponse(new TopicLecturerUpdateDto(item.IsPrimary)));
        }

        [HttpPut("update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> Update(int topicId, int lecturerProfileId, [FromBody] TopicLecturerUpdateDto dto)
        {
            var item = await _uow.TopicLecturers.Query()
                .FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));

            if (dto.IsPrimary.HasValue) item.IsPrimary = dto.IsPrimary.Value;

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
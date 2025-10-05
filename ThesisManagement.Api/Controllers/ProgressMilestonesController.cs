using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class ProgressMilestonesController : BaseApiController
    {
        public ProgressMilestonesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] ProgressMilestoneFilter filter)
        {
            var result = await _uow.ProgressMilestones.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<ProgressMilestoneReadDto>(x));
            return Ok(ApiResponse<IEnumerable<ProgressMilestoneReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.ProgressMilestones.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));
            return Ok(ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(_mapper.Map<ProgressMilestoneReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { TopicID = 0, Type = "OUTLINE" }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressMilestoneCreateDto dto)
        {
            var code = _codeGen.Generate("MILE");
            var ent = new ProgressMilestone
            {
                MilestoneCode = code,
                TopicCode = dto.TopicCode,
                Type = dto.Type,
                Deadline = dto.Deadline,
                Note = dto.Note,
                State = "NOT_STARTED",
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.ProgressMilestones.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(_mapper.Map<ProgressMilestoneReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.ProgressMilestones.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));
            return Ok(ApiResponse<ProgressMilestoneUpdateDto>.SuccessResponse(new ProgressMilestoneUpdateDto(ent.Type, ent.Deadline, ent.State, ent.Note)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProgressMilestoneUpdateDto dto)
        {
            var ent = await _uow.ProgressMilestones.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));
            ent.Type = dto.Type ?? ent.Type;
            ent.Deadline = dto.Deadline;
            ent.State = dto.State ?? ent.State;
            ent.Note = dto.Note;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.ProgressMilestones.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(_mapper.Map<ProgressMilestoneReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.ProgressMilestones.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));
            _uow.ProgressMilestones.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

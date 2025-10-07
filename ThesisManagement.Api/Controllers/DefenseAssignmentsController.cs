using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseAssignmentsController : BaseApiController
    {
        public DefenseAssignmentsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseAssignmentFilter filter)
        {
            var result = await _uow.DefenseAssignments.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<DefenseAssignmentReadDto>(x));
            return Ok(ApiResponse<IEnumerable<DefenseAssignmentReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.DefenseAssignments.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Assignment not found", 404));
            return Ok(ApiResponse<DefenseAssignmentReadDto>.SuccessResponse(_mapper.Map<DefenseAssignmentReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { TopicID = 0, CommitteeID = 0 }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseAssignmentCreateDto dto)
        {
            var code = _codeGen.Generate("ASSG");
            var ent = new DefenseAssignment
            {
                AssignmentCode = code,
                TopicCode = dto.TopicCode,
                CommitteeCode = dto.CommitteeCode,
                ScheduledAt = dto.ScheduledAt,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.DefenseAssignments.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<DefenseAssignmentReadDto>.SuccessResponse(_mapper.Map<DefenseAssignmentReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.DefenseAssignments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Assignment not found", 404));
            return Ok(ApiResponse<DefenseAssignmentUpdateDto>.SuccessResponse(new DefenseAssignmentUpdateDto(ent.CommitteeCode, ent.ScheduledAt)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseAssignmentUpdateDto dto)
        {
            var ent = await _uow.DefenseAssignments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Assignment not found", 404));
            ent.CommitteeCode = dto.CommitteeCode ?? ent.CommitteeCode;
            ent.ScheduledAt = dto.ScheduledAt ?? ent.ScheduledAt;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.DefenseAssignments.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<DefenseAssignmentReadDto>.SuccessResponse(_mapper.Map<DefenseAssignmentReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.DefenseAssignments.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Assignment not found", 404));
            _uow.DefenseAssignments.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

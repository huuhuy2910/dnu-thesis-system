using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        public IActionResult GetCreate()
        {
            var sample = new ProgressMilestoneCreateDto(
                string.Empty,
                null,
                null,
                null,
                null,
                "Chưa bắt đầu",
                null,
                null);
            return Ok(ApiResponse<ProgressMilestoneCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressMilestoneCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TopicCode))
                return BadRequest(ApiResponse<object>.Fail("TopicCode is required", 400));
            if (dto.TopicID.HasValue && dto.TopicID <= 0)
                return BadRequest(ApiResponse<object>.Fail("TopicID must be positive", 400));
            var code = _codeGen.Generate("MILE");
            MilestoneTemplate? template = null;
            if (!string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode))
            {
                template = await _uow.MilestoneTemplates.Query().FirstOrDefaultAsync(x => x.MilestoneTemplateCode == dto.MilestoneTemplateCode);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("MilestoneTemplate not found", 400));
            }

            var ent = new ProgressMilestone
            {
                MilestoneCode = code,
                TopicID = dto.TopicID,
                TopicCode = dto.TopicCode,
                MilestoneTemplateCode = template?.MilestoneTemplateCode ?? dto.MilestoneTemplateCode,
                Ordinal = dto.Ordinal ?? template?.Ordinal,
                Deadline = dto.Deadline,
                State = string.IsNullOrWhiteSpace(dto.State) ? "Chưa bắt đầu" : dto.State,
                StartedAt = dto.StartedAt,
                CompletedAt = dto.CompletedAt,
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
            var dto = new ProgressMilestoneUpdateDto(
                ent.TopicID,
                ent.MilestoneTemplateCode,
                ent.Ordinal,
                ent.Deadline,
                ent.State,
                ent.StartedAt,
                ent.CompletedAt);
            return Ok(ApiResponse<ProgressMilestoneUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProgressMilestoneUpdateDto dto)
        {
            var ent = await _uow.ProgressMilestones.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));
            if (dto.TopicID.HasValue)
                ent.TopicID = dto.TopicID;
            if (!string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode) && !string.Equals(dto.MilestoneTemplateCode, ent.MilestoneTemplateCode, StringComparison.OrdinalIgnoreCase))
            {
                var template = await _uow.MilestoneTemplates.Query().FirstOrDefaultAsync(x => x.MilestoneTemplateCode == dto.MilestoneTemplateCode);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("MilestoneTemplate not found", 400));
                ent.MilestoneTemplateCode = template.MilestoneTemplateCode;
                if (!dto.Ordinal.HasValue)
                    ent.Ordinal = template.Ordinal;
            }

            if (dto.Ordinal.HasValue)
                ent.Ordinal = dto.Ordinal;

            ent.Deadline = dto.Deadline;
            if (!string.IsNullOrWhiteSpace(dto.State))
                ent.State = dto.State;
            ent.StartedAt = dto.StartedAt;
            ent.CompletedAt = dto.CompletedAt;
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

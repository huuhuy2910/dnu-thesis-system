using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MilestoneTemplatesController : BaseApiController
    {
        public MilestoneTemplatesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
            : base(uow, codeGen, mapper)
        {
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] MilestoneTemplateFilter filter)
        {
            var result = await _uow.MilestoneTemplates.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<MilestoneTemplateReadDto>(x));
            return Ok(ApiResponse<IEnumerable<MilestoneTemplateReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.MilestoneTemplates.GetByCodeAsync(code);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            return Ok(ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(_mapper.Map<MilestoneTemplateReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new MilestoneTemplateCreateDto(string.Empty, string.Empty, null, 1);
            return Ok(ApiResponse<MilestoneTemplateCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MilestoneTemplateCreateDto dto)
        {
            if (dto.Ordinal <= 0)
                return BadRequest(ApiResponse<object>.Fail("Ordinal must be greater than zero", 400));

            var code = string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode)
                ? _codeGen.Generate("MTPL")
                : dto.MilestoneTemplateCode.Trim();

            var ent = new MilestoneTemplate
            {
                MilestoneTemplateCode = code,
                Name = dto.Name,
                Description = dto.Description,
                Ordinal = dto.Ordinal,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.MilestoneTemplates.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(_mapper.Map<MilestoneTemplateReadDto>(ent), 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.MilestoneTemplates.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            var dto = new MilestoneTemplateUpdateDto(ent.Name, ent.Description, ent.Ordinal);
            return Ok(ApiResponse<MilestoneTemplateUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MilestoneTemplateUpdateDto dto)
        {
            var ent = await _uow.MilestoneTemplates.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            if (!string.IsNullOrWhiteSpace(dto.Name))
                ent.Name = dto.Name;

            if (dto.Description != null)
                ent.Description = dto.Description;

            if (dto.Ordinal.HasValue)
            {
                if (dto.Ordinal <= 0)
                    return BadRequest(ApiResponse<object>.Fail("Ordinal must be greater than zero", 400));
                ent.Ordinal = dto.Ordinal.Value;
            }

            ent.LastUpdated = DateTime.UtcNow;
            _uow.MilestoneTemplates.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(_mapper.Map<MilestoneTemplateReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.MilestoneTemplates.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            _uow.MilestoneTemplates.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

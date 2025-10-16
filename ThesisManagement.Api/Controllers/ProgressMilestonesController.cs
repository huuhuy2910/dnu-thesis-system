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
        public async Task<IActionResult> GetCreate()
        {
            // compute next MilestoneCode in MSyymmddNNN format
            var now = DateTime.UtcNow;
            var prefix = $"MS{now:yyyyMMdd}";
            var recent = await _uow.ProgressMilestones.Query()
                .Where(x => x.MilestoneCode != null && EF.Functions.Like(x.MilestoneCode, prefix + "%"))
                .OrderByDescending(x => x.MilestoneID)
                .Select(x => x.MilestoneCode)
                .Take(100)
                .ToListAsync();

            int maxSeq = 0;
            foreach (var c in recent)
            {
                if (string.IsNullOrWhiteSpace(c) || c.Length < prefix.Length + 3) continue;
                var suffix = c.Substring(prefix.Length);
                var digits = suffix.Length >= 3 ? suffix.Substring(suffix.Length - 3) : suffix;
                if (int.TryParse(digits, out var n))
                {
                    if (n > maxSeq) maxSeq = n;
                }
            }
            var nextCode = prefix + (maxSeq + 1).ToString("D3");

            var sample = new ProgressMilestoneCreateDto(
                nextCode,
                string.Empty,
                null,
                "MS_REG",
                1,
                null,
                "Đang thực hiện",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
            // FE will fill CompletedAt1-5, backend does not set default
            return Ok(ApiResponse<ProgressMilestoneCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressMilestoneCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TopicCode))
                return BadRequest(ApiResponse<object>.Fail("TopicCode is required", 400));
            // TopicID can be null, will be resolved from TopicCode if needed
            int topicId;
            if (dto.TopicID.HasValue)
            {
                topicId = dto.TopicID.Value;
            }
            else
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(x => x.TopicCode == dto.TopicCode);
                if (topic == null)
                    return BadRequest(ApiResponse<object>.Fail("Topic not found for the provided TopicCode", 400));
                topicId = topic.TopicID;
            }
            // generate MilestoneCode in format MSyymmddNNN when not provided
            var code = dto.MilestoneCode;
            if (string.IsNullOrWhiteSpace(code))
            {
                var now = DateTime.UtcNow;
                var prefix = $"MS{now:yyMMdd}";
                // fetch recent codes with same prefix (take a small batch) and derive max suffix
                var recent = await _uow.ProgressMilestones.Query()
                    .Where(x => x.MilestoneCode != null && EF.Functions.Like(x.MilestoneCode, prefix + "%"))
                    .OrderByDescending(x => x.MilestoneID)
                    .Select(x => x.MilestoneCode)
                    .Take(100)
                    .ToListAsync();

                int maxSeq = 0;
                foreach (var c in recent)
                {
                    if (string.IsNullOrWhiteSpace(c) || c.Length < prefix.Length + 3) continue;
                    var suffix = c.Substring(prefix.Length);
                    // if suffix contains non-digits, try to parse trailing 3 characters
                    var digits = suffix.Length >= 3 ? suffix.Substring(suffix.Length - 3) : suffix;
                    if (int.TryParse(digits, out var n))
                    {
                        if (n > maxSeq) maxSeq = n;
                    }
                }
                var next = maxSeq + 1;
                code = prefix + next.ToString("D3");
            }
            MilestoneTemplate? template = null;
            if (!string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode))
            {
                template = await _uow.MilestoneTemplates.Query().FirstOrDefaultAsync(x => x.MilestoneTemplateCode == dto.MilestoneTemplateCode);
                if (template == null)
                    return BadRequest(ApiResponse<object>.Fail("MilestoneTemplate not found", 400));
            }

            var ent = new ProgressMilestone
            {
                MilestoneCode = string.IsNullOrWhiteSpace(dto.MilestoneCode) ? code : dto.MilestoneCode,
                TopicID = topicId,
                TopicCode = dto.TopicCode,
                // MilestoneTemplateCode will be set below (use template if present)
                Ordinal = dto.Ordinal ?? template?.Ordinal,
                Deadline = dto.Deadline,
                State = string.IsNullOrWhiteSpace(dto.State) ? "Chưa bắt đầu" : dto.State,
                StartedAt = dto.StartedAt,
                CompletedAt1 = dto.CompletedAt1,
                CompletedAt2 = dto.CompletedAt2,
                CompletedAt3 = dto.CompletedAt3,
                CompletedAt4 = dto.CompletedAt4,
                CompletedAt5 = dto.CompletedAt5,
                CreatedAt = dto.CreatedAt ?? DateTime.UtcNow,
                LastUpdated = dto.LastUpdated ?? DateTime.UtcNow
            };
            // ensure MilestoneTemplateCode assigned after construction to use template if present
            ent.MilestoneTemplateCode = template?.MilestoneTemplateCode ?? dto.MilestoneTemplateCode;
            await _uow.ProgressMilestones.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(_mapper.Map<ProgressMilestoneReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{topicId}")]
        public async Task<IActionResult> GetUpdate(int topicId)
        {
            // Find the most recent milestone for the given TopicID
            var ent = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topicId)
                .OrderByDescending(x => x.MilestoneID)
                .FirstOrDefaultAsync();
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found for the provided TopicID", 404));
            var dto = new ProgressMilestoneUpdateDto(
                ent.MilestoneCode,
                ent.TopicID,
                ent.TopicCode,
                ent.MilestoneTemplateCode,
                ent.Ordinal,
                ent.Deadline,
                ent.State,
                ent.StartedAt,
                ent.CompletedAt1,
                ent.CompletedAt2,
                ent.CompletedAt3,
                ent.CompletedAt4,
                ent.CompletedAt5,
                ent.CreatedAt,
                ent.LastUpdated);
            return Ok(ApiResponse<ProgressMilestoneUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{topicId}")]
        public async Task<IActionResult> Update(int topicId, [FromBody] ProgressMilestoneUpdateDto dto)
        {
            // Find the most recent milestone for the given TopicID
            var ent = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topicId)
                .OrderByDescending(x => x.MilestoneID)
                .FirstOrDefaultAsync();
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Milestone not found for the provided TopicID", 404));

            // Allow changing TopicID (or resolving from TopicCode) if requested
            if (dto.TopicID.HasValue)
            {
                ent.TopicID = dto.TopicID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TopicCode))
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(x => x.TopicCode == dto.TopicCode);
                if (topic == null)
                    return BadRequest(ApiResponse<object>.Fail("Topic not found for the provided TopicCode", 400));
                ent.TopicID = topic.TopicID;
            }
            if (!string.IsNullOrWhiteSpace(dto.TopicCode))
                ent.TopicCode = dto.TopicCode;

            // NOTE: Per request, do not update MilestoneCode here - leave it unchanged

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
            ent.CompletedAt1 = dto.CompletedAt1;
            ent.CompletedAt2 = dto.CompletedAt2;
            ent.CompletedAt3 = dto.CompletedAt3;
            ent.CompletedAt4 = dto.CompletedAt4;
            ent.CompletedAt5 = dto.CompletedAt5;
            ent.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;
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

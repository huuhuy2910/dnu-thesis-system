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
    public class ProgressSubmissionsController : BaseApiController
    {
        public ProgressSubmissionsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] ProgressSubmissionFilter filter)
        {
            var result = await _uow.ProgressSubmissions.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<ProgressSubmissionReadDto>(x));
            return Ok(ApiResponse<IEnumerable<ProgressSubmissionReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.ProgressSubmissions.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            return Ok(ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(_mapper.Map<ProgressSubmissionReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sampleCode = await GenerateSubmissionCodeAsync();
            var sample = new
            {
                SubmissionCode = sampleCode,
                MilestoneID = (int?)null,
                MilestoneCode = string.Empty,
                StudentUserID = (int?)null,
                StudentUserCode = string.Empty,
                StudentProfileID = (int?)null,
                StudentProfileCode = (string?)null,
                AttemptNumber = (int?)1,
                ReportTitle = (string?)null,
                ReportDescription = (string?)null
            };
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressSubmissionCreateDto dto)
        {
            if (dto.MilestoneID.HasValue && dto.MilestoneID <= 0)
                return BadRequest(ApiResponse<object>.Fail("MilestoneID must be positive", 400));

            if (string.IsNullOrWhiteSpace(dto.MilestoneCode))
                return BadRequest(ApiResponse<object>.Fail("MilestoneCode is required", 400));
            if (dto.StudentUserID.HasValue && dto.StudentUserID <= 0)
                return BadRequest(ApiResponse<object>.Fail("StudentUserID must be positive", 400));

            if (string.IsNullOrWhiteSpace(dto.StudentUserCode))
                return BadRequest(ApiResponse<object>.Fail("StudentUserCode is required", 400));

            if (dto.StudentProfileID.HasValue && dto.StudentProfileID <= 0)
                return BadRequest(ApiResponse<object>.Fail("StudentProfileID must be positive", 400));

            var code = await GenerateSubmissionCodeAsync();
            var ent = new ProgressSubmission
            {
                SubmissionCode = code,
                MilestoneID = dto.MilestoneID,
                MilestoneCode = dto.MilestoneCode,
                StudentUserID = dto.StudentUserID,
                StudentUserCode = dto.StudentUserCode,
                StudentProfileID = dto.StudentProfileID,
                StudentProfileCode = dto.StudentProfileCode,
                AttemptNumber = dto.AttemptNumber ?? 1,
                ReportTitle = dto.ReportTitle,
                ReportDescription = dto.ReportDescription,
                SubmittedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.ProgressSubmissions.AddAsync(ent);
            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // If duplicate code due to race, regenerate and retry once
                ent.SubmissionCode = await GenerateSubmissionCodeAsync();
                await _uow.SaveChangesAsync();
            }
            return StatusCode(201, ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(_mapper.Map<ProgressSubmissionReadDto>(ent),1,201));
        }

        private async Task<string> GenerateSubmissionCodeAsync()
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var prefix = $"SUBF{datePart}";

            // Get existing codes for today
            var existing = await _uow.ProgressSubmissions.Query()
                .Where(s => EF.Functions.Like(s.SubmissionCode, prefix + "%"))
                .Select(s => s.SubmissionCode)
                .ToListAsync();

            int maxSuffix = 0;
            foreach (var c in existing)
            {
                if (c.Length > prefix.Length)
                {
                    var suffix = c.Substring(prefix.Length);
                    if (int.TryParse(suffix, out var n))
                        maxSuffix = Math.Max(maxSuffix, n);
                }
            }

            var next = maxSuffix + 1;
            return $"{prefix}{next:D3}";
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            var dto = new ProgressSubmissionUpdateDto(
                ent.LecturerComment,
                ent.LecturerState,
                ent.FeedbackLevel,
                ent.AttemptNumber,
                ent.ReportTitle,
                ent.ReportDescription);
            return Ok(ApiResponse<ProgressSubmissionUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProgressSubmissionUpdateDto dto)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            ent.LecturerComment = dto.LecturerComment ?? ent.LecturerComment;
            ent.LecturerState = dto.LecturerState ?? ent.LecturerState;
            ent.FeedbackLevel = dto.FeedbackLevel ?? ent.FeedbackLevel;
            if (dto.AttemptNumber.HasValue)
                ent.AttemptNumber = dto.AttemptNumber;
            if (dto.ReportTitle != null)
                ent.ReportTitle = dto.ReportTitle;
            if (dto.ReportDescription != null)
                ent.ReportDescription = dto.ReportDescription;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.ProgressSubmissions.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(_mapper.Map<ProgressSubmissionReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            _uow.ProgressSubmissions.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
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
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { MilestoneID = 0, StudentUserID = 0 }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressSubmissionCreateDto dto)
        {
            var code = _codeGen.Generate("SUB");
            var ent = new ProgressSubmission
            {
                SubmissionCode = code,
                MilestoneCode = dto.MilestoneCode,
                StudentUserCode = dto.StudentUserCode,
                StudentProfileCode = dto.StudentProfileCode,
                FileURL = dto.FileURL,
                SubmittedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.ProgressSubmissions.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(_mapper.Map<ProgressSubmissionReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            return Ok(ApiResponse<ProgressSubmissionUpdateDto>.SuccessResponse(new ProgressSubmissionUpdateDto(ent.FileURL, ent.LecturerComment, ent.LecturerState, ent.FeedbackLevel)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProgressSubmissionUpdateDto dto)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            ent.FileURL = dto.FileURL ?? ent.FileURL;
            ent.LecturerComment = dto.LecturerComment ?? ent.LecturerComment;
            ent.LecturerState = dto.LecturerState ?? ent.LecturerState;
            ent.FeedbackLevel = dto.FeedbackLevel ?? ent.FeedbackLevel;
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

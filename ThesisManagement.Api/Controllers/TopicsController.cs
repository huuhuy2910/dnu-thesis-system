using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class TopicsController : BaseApiController
    {
        public TopicsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        private async Task<string> GenerateTopicCodeAsync()
        {
            int currentYear = DateTime.Now.Year;
            string prefix = $"TOP{currentYear}_SELF_";

            // Lấy tất cả các mã bắt đầu bằng prefix trong năm hiện tại
            var lastTopic = await _uow.Topics.Query()
                .Where(t => t.TopicCode.StartsWith(prefix))
                .OrderByDescending(t => t.TopicCode)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (lastTopic != null)
            {
                // Cắt phần số ở cuối để +1
                string lastCode = lastTopic.TopicCode;
                string[] parts = lastCode.Split('_');
                if (parts.Length >= 3 && int.TryParse(parts[^1], out int lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }

            string newCode = $"{prefix}{nextNumber:D3}"; // D3 -> padding 3 số 001,002,...
            return newCode;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] TopicFilter filter)
        {
            var result = await _uow.Topics.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<TopicReadDto>(x));
            return Ok(ApiResponse<IEnumerable<TopicReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.Topics.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            return Ok(ApiResponse<TopicReadDto>.SuccessResponse(_mapper.Map<TopicReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var now = DateTime.UtcNow;
            var generatedCode = await GenerateTopicCodeAsync();
            var sample = new TopicCreateDto(
                TopicCode: generatedCode,
                Title: string.Empty,
                Summary: null,
                Type: "SELF",
                ProposerUserID: 0,
                ProposerUserCode: string.Empty,
                ProposerStudentProfileID: null,
                ProposerStudentCode: null,
                SupervisorUserID: null,
                SupervisorUserCode: null,
                SupervisorLecturerProfileID: null,
                SupervisorLecturerCode: null,
                CatalogTopicID: null,
                CatalogTopicCode: null,
                DepartmentID: null,
                DepartmentCode: null,
                Status: "DRAFT",
                ResubmitCount: 0,
                CreatedAt: now,
                LastUpdated: now,
                SpecialtyID: null,
                SpecialtyCode: null
            );

            return Ok(ApiResponse<TopicCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicCreateDto dto)
        {
            var code = string.IsNullOrWhiteSpace(dto.TopicCode)
                ? await GenerateTopicCodeAsync()
                : dto.TopicCode;
            var ent = new Topic
            {
                TopicCode = code,
                Title = dto.Title,
                Summary = dto.Summary,
                Type = dto.Type,
                ProposerUserID = dto.ProposerUserID,
                ProposerUserCode = dto.ProposerUserCode,
                ProposerStudentProfileID = dto.ProposerStudentProfileID,
                ProposerStudentCode = dto.ProposerStudentCode,
                SupervisorUserID = dto.SupervisorUserID,
                SupervisorUserCode = dto.SupervisorUserCode,
                SupervisorLecturerProfileID = dto.SupervisorLecturerProfileID,
                SupervisorLecturerCode = dto.SupervisorLecturerCode,
                CatalogTopicID = dto.CatalogTopicID,
                CatalogTopicCode = dto.CatalogTopicCode,
                DepartmentID = dto.DepartmentID,
                DepartmentCode = dto.DepartmentCode,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "DRAFT" : dto.Status,
                ResubmitCount = dto.ResubmitCount ?? 0,
                CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
                LastUpdated = dto.LastUpdated == default ? DateTime.UtcNow : dto.LastUpdated,
                SpecialtyID = dto.SpecialtyID,
                SpecialtyCode = dto.SpecialtyCode
            };
            await _uow.Topics.AddAsync(ent);
            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Nếu có lỗi trùng mã (do race condition), sinh lại và lưu tiếp
                ent.TopicCode = await GenerateTopicCodeAsync();
                await _uow.SaveChangesAsync();
            }
            return StatusCode(201, ApiResponse<TopicReadDto>.SuccessResponse(_mapper.Map<TopicReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Topics.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            var sample = new TopicUpdateDto(
                Title: ent.Title,
                Summary: ent.Summary,
                Type: ent.Type,
                ProposerUserID: ent.ProposerUserID,
                ProposerUserCode: ent.ProposerUserCode,
                ProposerStudentProfileID: ent.ProposerStudentProfileID,
                ProposerStudentCode: ent.ProposerStudentCode,
                SupervisorUserID: ent.SupervisorUserID,
                SupervisorUserCode: ent.SupervisorUserCode,
                SupervisorLecturerProfileID: ent.SupervisorLecturerProfileID,
                SupervisorLecturerCode: ent.SupervisorLecturerCode,
                CatalogTopicID: ent.CatalogTopicID,
                CatalogTopicCode: ent.CatalogTopicCode,
                DepartmentID: ent.DepartmentID,
                DepartmentCode: ent.DepartmentCode,
                Status: ent.Status,
                ResubmitCount: ent.ResubmitCount,
                CreatedAt: ent.CreatedAt,
                LastUpdated: ent.LastUpdated,
                SpecialtyID: ent.SpecialtyID,
                SpecialtyCode: ent.SpecialtyCode
            );
            return Ok(ApiResponse<TopicUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TopicUpdateDto dto)
        {
            var ent = await _uow.Topics.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            if (!string.IsNullOrWhiteSpace(dto.Title)) ent.Title = dto.Title;
            if (dto.Summary is not null) ent.Summary = dto.Summary;
            // Tags will be handled through TopicTag relationship
            if (!string.IsNullOrWhiteSpace(dto.Type)) ent.Type = dto.Type;
            if (dto.ProposerUserID.HasValue) ent.ProposerUserID = dto.ProposerUserID.Value;
            if (dto.ProposerUserCode is not null) ent.ProposerUserCode = dto.ProposerUserCode;
            if (dto.ProposerStudentProfileID.HasValue) ent.ProposerStudentProfileID = dto.ProposerStudentProfileID.Value;
            if (dto.ProposerStudentCode is not null) ent.ProposerStudentCode = dto.ProposerStudentCode;
            if (dto.SupervisorUserID.HasValue) ent.SupervisorUserID = dto.SupervisorUserID.Value;
            if (dto.SupervisorUserCode is not null) ent.SupervisorUserCode = dto.SupervisorUserCode;
            if (dto.SupervisorLecturerProfileID.HasValue) ent.SupervisorLecturerProfileID = dto.SupervisorLecturerProfileID.Value;
            if (dto.SupervisorLecturerCode is not null) ent.SupervisorLecturerCode = dto.SupervisorLecturerCode;
            if (dto.CatalogTopicID.HasValue) ent.CatalogTopicID = dto.CatalogTopicID.Value;
            if (dto.CatalogTopicCode is not null) ent.CatalogTopicCode = dto.CatalogTopicCode;
            if (dto.DepartmentID.HasValue) ent.DepartmentID = dto.DepartmentID.Value;
            if (dto.DepartmentCode is not null) ent.DepartmentCode = dto.DepartmentCode;
            if (dto.Status is not null) ent.Status = dto.Status;
            if (dto.ResubmitCount.HasValue) ent.ResubmitCount = dto.ResubmitCount.Value;
            if (dto.SpecialtyID.HasValue) ent.SpecialtyID = dto.SpecialtyID.Value;
            if (dto.SpecialtyCode is not null) ent.SpecialtyCode = dto.SpecialtyCode;
            if (dto.CreatedAt.HasValue) ent.CreatedAt = dto.CreatedAt.Value;
            ent.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;
            _uow.Topics.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<TopicReadDto>.SuccessResponse(_mapper.Map<TopicReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.Topics.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            _uow.Topics.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

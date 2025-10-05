using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class TopicsController : BaseApiController
    {
        public TopicsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

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
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { Title = "", Type = "SELF" }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicCreateDto dto)
        {
            var code = _codeGen.Generate("TOP");
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
                Status = dto.Status ?? "DRAFT",
                ResubmitCount = dto.ResubmitCount ?? 0,
                CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
                LastUpdated = dto.LastUpdated == default ? DateTime.UtcNow : dto.LastUpdated,
                SpecialtyID = dto.SpecialtyID,
                SpecialtyCode = dto.SpecialtyCode
            };
            await _uow.Topics.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<TopicReadDto>.SuccessResponse(_mapper.Map<TopicReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Topics.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            var sample = new TopicUpdateDto(
                ent.Title,
                ent.Summary,
                ent.Status,
                ent.SupervisorUserID,
                ent.SupervisorUserCode,
                ent.SupervisorLecturerProfileID,
                ent.SupervisorLecturerCode,
                ent.DepartmentID,
                ent.DepartmentCode,
                ent.SpecialtyID,
                ent.SpecialtyCode
            );
            return Ok(ApiResponse<TopicUpdateDto>.SuccessResponse(sample));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TopicUpdateDto dto)
        {
            var ent = await _uow.Topics.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Topic not found", 404));
            if (!string.IsNullOrWhiteSpace(dto.Title)) ent.Title = dto.Title;
            ent.Summary = dto.Summary;
            // Tags will be handled through TopicTag relationship
            ent.Status = dto.Status ?? ent.Status;
            ent.SupervisorUserID = dto.SupervisorUserID ?? ent.SupervisorUserID;
            ent.SupervisorUserCode = dto.SupervisorUserCode ?? ent.SupervisorUserCode;
            ent.SupervisorLecturerProfileID = dto.SupervisorLecturerProfileID ?? ent.SupervisorLecturerProfileID;
            ent.SupervisorLecturerCode = dto.SupervisorLecturerCode ?? ent.SupervisorLecturerCode;
            ent.DepartmentID = dto.DepartmentID ?? ent.DepartmentID;
            ent.DepartmentCode = dto.DepartmentCode ?? ent.DepartmentCode;
            ent.SpecialtyID = dto.SpecialtyID ?? ent.SpecialtyID;
            ent.SpecialtyCode = dto.SpecialtyCode ?? ent.SpecialtyCode;
            ent.LastUpdated = DateTime.UtcNow;
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

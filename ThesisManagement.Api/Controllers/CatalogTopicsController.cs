using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class CatalogTopicsController : BaseApiController
    {
        public CatalogTopicsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CatalogTopicFilter filter)
        {
            var result = await _uow.CatalogTopics.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<CatalogTopicReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CatalogTopicReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            return Ok(ApiResponse<CatalogTopicReadDto>.SuccessResponse(_mapper.Map<CatalogTopicReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { Title = "", Summary = "", Tags = "", AssignedStatus = "", AssignedAt = (DateTime?)null }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CatalogTopicCreateDto dto)
        {
            // Resolve Department by Code if provided
            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }
            
            var code = _codeGen.Generate("CAT");
            var ent = new CatalogTopic
            {
                CatalogTopicCode = code,
                Title = dto.Title,
                Summary = dto.Summary,
                DepartmentID = department?.DepartmentID,
                DepartmentCode = dto.DepartmentCode,
                AssignedStatus = dto.AssignedStatus,
                AssignedAt = dto.AssignedAt,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.CatalogTopics.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<CatalogTopicReadDto>.SuccessResponse(_mapper.Map<CatalogTopicReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{code}")]
        public async Task<IActionResult> GetUpdate(string code)
        {
            var ent = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            return Ok(ApiResponse<CatalogTopicUpdateDto>.SuccessResponse(new CatalogTopicUpdateDto(ent.Title, ent.Summary, ent.DepartmentCode, ent.AssignedStatus, ent.AssignedAt)));
        }

        [HttpPut("update/{code}")]
        public async Task<IActionResult> Update(string code, [FromBody] CatalogTopicUpdateDto dto)
        {
            var ent = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            if (!string.IsNullOrWhiteSpace(dto.Title)) ent.Title = dto.Title;
            ent.Summary = dto.Summary;
            
            // Resolve Department by Code if provided
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                var department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                ent.DepartmentID = department?.DepartmentID;
                ent.DepartmentCode = dto.DepartmentCode;
            }
            
            ent.AssignedStatus = dto.AssignedStatus;
            ent.AssignedAt = dto.AssignedAt;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.CatalogTopics.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<CatalogTopicReadDto>.SuccessResponse(_mapper.Map<CatalogTopicReadDto>(ent)));
        }

        [HttpDelete("delete/{code}")]
        public async Task<IActionResult> Delete(string code)
        {
            var ent = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("CatalogTopic not found", 404));
            _uow.CatalogTopics.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

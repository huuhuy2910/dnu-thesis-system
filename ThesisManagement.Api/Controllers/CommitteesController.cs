using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class CommitteesController : BaseApiController
    {
        public CommitteesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] CommitteeFilter filter)
        {
            var result = await _uow.Committees.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<CommitteeReadDto>(x));
            return Ok(ApiResponse<IEnumerable<CommitteeReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.Committees.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Committee not found", 404));
            return Ok(ApiResponse<CommitteeReadDto>.SuccessResponse(_mapper.Map<CommitteeReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { Name = "", DefenseDate = (DateTime?)null }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CommitteeCreateDto dto)
        {
            var code = _codeGen.Generate("COM");
            var ent = new Committee
            {
                CommitteeCode = code,
                Name = dto.Name,
                DefenseDate = dto.DefenseDate,
                Room = dto.Room,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.Committees.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<CommitteeReadDto>.SuccessResponse(_mapper.Map<CommitteeReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.Committees.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Committee not found", 404));
            return Ok(ApiResponse<CommitteeUpdateDto>.SuccessResponse(new CommitteeUpdateDto(ent.Name, ent.DefenseDate, ent.Room)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CommitteeUpdateDto dto)
        {
            var ent = await _uow.Committees.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Committee not found", 404));
            ent.Name = dto.Name ?? ent.Name;
            ent.DefenseDate = dto.DefenseDate ?? ent.DefenseDate;
            ent.Room = dto.Room ?? ent.Room;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.Committees.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<CommitteeReadDto>.SuccessResponse(_mapper.Map<CommitteeReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.Committees.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Committee not found", 404));
            _uow.Committees.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

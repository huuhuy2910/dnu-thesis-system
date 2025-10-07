using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseScoresController : BaseApiController
    {
        public DefenseScoresController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) : base(uow, codeGen, mapper) { }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseScoreFilter filter)
        {
            var result = await _uow.DefenseScores.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<DefenseScoreReadDto>(x));
            return Ok(ApiResponse<IEnumerable<DefenseScoreReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var ent = await _uow.DefenseScores.GetByCodeAsync(code);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            return Ok(ApiResponse<DefenseScoreReadDto>.SuccessResponse(_mapper.Map<DefenseScoreReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate() => Ok(ApiResponse<object>.SuccessResponse(new { AssignmentID = 0, MemberLecturerUserID = 0, Score = 0.0m }));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseScoreCreateDto dto)
        {
            var code = _codeGen.Generate("SCORE");
            var ent = new DefenseScore
            {
                ScoreCode = code,
                AssignmentCode = dto.AssignmentCode,
                MemberLecturerUserCode = dto.MemberLecturerUserCode,
                MemberLecturerCode = dto.MemberLecturerCode,
                Score = dto.Score,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.DefenseScores.AddAsync(ent);
            await _uow.SaveChangesAsync();
            return StatusCode(201, ApiResponse<DefenseScoreReadDto>.SuccessResponse(_mapper.Map<DefenseScoreReadDto>(ent),1,201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.DefenseScores.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            return Ok(ApiResponse<DefenseScoreUpdateDto>.SuccessResponse(new DefenseScoreUpdateDto(ent.Score, ent.Comment)));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseScoreUpdateDto dto)
        {
            var ent = await _uow.DefenseScores.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            ent.Score = dto.Score ?? ent.Score;
            ent.Comment = dto.Comment ?? ent.Comment;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.DefenseScores.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<DefenseScoreReadDto>.SuccessResponse(_mapper.Map<DefenseScoreReadDto>(ent)));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.DefenseScores.GetByIdAsync(id);
            if (ent == null) return NotFound(ApiResponse<object>.Fail("Score not found", 404));
            _uow.DefenseScores.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

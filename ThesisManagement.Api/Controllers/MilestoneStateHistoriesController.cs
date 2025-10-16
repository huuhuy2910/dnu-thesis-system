using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MilestoneStateHistoriesController : BaseApiController
    {
        public MilestoneStateHistoriesController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper)
            : base(uow, codeGen, mapper)
        {
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] MilestoneStateHistoryFilter filter)
        {
            var result = await _uow.MilestoneStateHistories.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            var dtos = result.Items.Select(x => _mapper.Map<MilestoneStateHistoryReadDto>(x));
            return Ok(ApiResponse<IEnumerable<MilestoneStateHistoryReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        [HttpGet("get-detail/{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var ent = await _uow.MilestoneStateHistories.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("State history not found", 404));

            return Ok(ApiResponse<MilestoneStateHistoryReadDto>.SuccessResponse(_mapper.Map<MilestoneStateHistoryReadDto>(ent)));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = new MilestoneStateHistoryCreateDto(0, null, null, null, string.Empty, null, null, null, null);
            return Ok(ApiResponse<MilestoneStateHistoryCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MilestoneStateHistoryCreateDto dto)
        {
            if (dto.MilestoneID <= 0)
                return BadRequest(ApiResponse<object>.Fail("MilestoneID must be greater than zero", 400));

            if (string.IsNullOrWhiteSpace(dto.NewState))
                return BadRequest(ApiResponse<object>.Fail("NewState is required", 400));

            var ent = new MilestoneStateHistory
            {
                MilestoneID = dto.MilestoneID,
                MilestoneCode = dto.MilestoneCode,
                TopicCode = dto.TopicCode,
                OldState = dto.OldState,
                NewState = dto.NewState,
                ChangedByUserCode = dto.ChangedByUserCode,
                ChangedByUserID = dto.ChangedByUserID,
                ChangedAt = dto.ChangedAt ?? DateTime.UtcNow,
                Comment = dto.Comment
            };

            await _uow.MilestoneStateHistories.AddAsync(ent);
            await _uow.SaveChangesAsync();

            return StatusCode(201, ApiResponse<MilestoneStateHistoryReadDto>.SuccessResponse(_mapper.Map<MilestoneStateHistoryReadDto>(ent), 1, 201));
        }

        [HttpGet("get-update/{id:int}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var ent = await _uow.MilestoneStateHistories.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("State history not found", 404));

            var dto = new MilestoneStateHistoryUpdateDto(ent.OldState, ent.NewState, ent.TopicCode, ent.ChangedByUserCode, ent.ChangedByUserID, ent.ChangedAt, ent.Comment);
            return Ok(ApiResponse<MilestoneStateHistoryUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] MilestoneStateHistoryUpdateDto dto)
        {
            var ent = await _uow.MilestoneStateHistories.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("State history not found", 404));

            if (dto.OldState != null)
                ent.OldState = dto.OldState;

            if (!string.IsNullOrWhiteSpace(dto.NewState))
                ent.NewState = dto.NewState;

            if (dto.TopicCode != null)
                ent.TopicCode = dto.TopicCode;

            if (dto.ChangedByUserCode != null)
                ent.ChangedByUserCode = dto.ChangedByUserCode;

            if (dto.ChangedByUserID.HasValue)
                ent.ChangedByUserID = dto.ChangedByUserID;

            if (dto.ChangedAt.HasValue)
                ent.ChangedAt = dto.ChangedAt.Value;

            if (dto.Comment != null)
                ent.Comment = dto.Comment;

            _uow.MilestoneStateHistories.Update(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<MilestoneStateHistoryReadDto>.SuccessResponse(_mapper.Map<MilestoneStateHistoryReadDto>(ent)));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ent = await _uow.MilestoneStateHistories.GetByIdAsync(id);
            if (ent == null)
                return NotFound(ApiResponse<object>.Fail("State history not found", 404));

            _uow.MilestoneStateHistories.Remove(ent);
            await _uow.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

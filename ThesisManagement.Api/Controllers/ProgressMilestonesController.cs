using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.ProgressMilestones;
using ThesisManagement.Api.Application.Query.ProgressMilestones;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.ProgressMilestones.Command;
using ThesisManagement.Api.DTOs.ProgressMilestones.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class ProgressMilestonesController : BaseApiController
    {
        private readonly IGetProgressMilestonesListQuery _getProgressMilestonesListQuery;
        private readonly IGetProgressMilestoneDetailQuery _getProgressMilestoneDetailQuery;
        private readonly IGetProgressMilestoneCreateQuery _getProgressMilestoneCreateQuery;
        private readonly IGetProgressMilestoneUpdateQuery _getProgressMilestoneUpdateQuery;
        private readonly ICreateProgressMilestoneCommand _createProgressMilestoneCommand;
        private readonly IUpdateProgressMilestoneCommand _updateProgressMilestoneCommand;
        private readonly IDeleteProgressMilestoneCommand _deleteProgressMilestoneCommand;

        public ProgressMilestonesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetProgressMilestonesListQuery getProgressMilestonesListQuery,
            IGetProgressMilestoneDetailQuery getProgressMilestoneDetailQuery,
            IGetProgressMilestoneCreateQuery getProgressMilestoneCreateQuery,
            IGetProgressMilestoneUpdateQuery getProgressMilestoneUpdateQuery,
            ICreateProgressMilestoneCommand createProgressMilestoneCommand,
            IUpdateProgressMilestoneCommand updateProgressMilestoneCommand,
            IDeleteProgressMilestoneCommand deleteProgressMilestoneCommand) : base(uow, codeGen, mapper)
        {
            _getProgressMilestonesListQuery = getProgressMilestonesListQuery;
            _getProgressMilestoneDetailQuery = getProgressMilestoneDetailQuery;
            _getProgressMilestoneCreateQuery = getProgressMilestoneCreateQuery;
            _getProgressMilestoneUpdateQuery = getProgressMilestoneUpdateQuery;
            _createProgressMilestoneCommand = createProgressMilestoneCommand;
            _updateProgressMilestoneCommand = updateProgressMilestoneCommand;
            _deleteProgressMilestoneCommand = deleteProgressMilestoneCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] ProgressMilestoneFilter filter)
        {
            var result = await _getProgressMilestonesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<ProgressMilestoneReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getProgressMilestoneDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Milestone not found", 404));

            return Ok(ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getProgressMilestoneCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<ProgressMilestoneCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressMilestoneCreateDto dto)
        {
            var result = await _createProgressMilestoneCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{topicId}")]
        public async Task<IActionResult> GetUpdate(int topicId)
        {
            var dto = await _getProgressMilestoneUpdateQuery.ExecuteAsync(topicId);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Milestone not found for the provided TopicID", 404));

            return Ok(ApiResponse<ProgressMilestoneUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{topicId}")]
        public async Task<IActionResult> Update(int topicId, [FromBody] ProgressMilestoneUpdateDto dto)
        {
            var result = await _updateProgressMilestoneCommand.ExecuteAsync(topicId, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<ProgressMilestoneReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteProgressMilestoneCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}

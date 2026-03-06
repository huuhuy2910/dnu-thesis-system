using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.ProgressSubmissions;
using ThesisManagement.Api.Application.Query.ProgressSubmissions;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class ProgressSubmissionsController : BaseApiController
    {
        private readonly IGetProgressSubmissionsListQuery _getProgressSubmissionsListQuery;
        private readonly IGetProgressSubmissionDetailQuery _getProgressSubmissionDetailQuery;
        private readonly IGetProgressSubmissionCreateQuery _getProgressSubmissionCreateQuery;
        private readonly IGetProgressSubmissionUpdateQuery _getProgressSubmissionUpdateQuery;
        private readonly ICreateProgressSubmissionCommand _createProgressSubmissionCommand;
        private readonly IUpdateProgressSubmissionCommand _updateProgressSubmissionCommand;
        private readonly IDeleteProgressSubmissionCommand _deleteProgressSubmissionCommand;

        public ProgressSubmissionsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetProgressSubmissionsListQuery getProgressSubmissionsListQuery,
            IGetProgressSubmissionDetailQuery getProgressSubmissionDetailQuery,
            IGetProgressSubmissionCreateQuery getProgressSubmissionCreateQuery,
            IGetProgressSubmissionUpdateQuery getProgressSubmissionUpdateQuery,
            ICreateProgressSubmissionCommand createProgressSubmissionCommand,
            IUpdateProgressSubmissionCommand updateProgressSubmissionCommand,
            IDeleteProgressSubmissionCommand deleteProgressSubmissionCommand) : base(uow, codeGen, mapper)
        {
            _getProgressSubmissionsListQuery = getProgressSubmissionsListQuery;
            _getProgressSubmissionDetailQuery = getProgressSubmissionDetailQuery;
            _getProgressSubmissionCreateQuery = getProgressSubmissionCreateQuery;
            _getProgressSubmissionUpdateQuery = getProgressSubmissionUpdateQuery;
            _createProgressSubmissionCommand = createProgressSubmissionCommand;
            _updateProgressSubmissionCommand = updateProgressSubmissionCommand;
            _deleteProgressSubmissionCommand = deleteProgressSubmissionCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] ProgressSubmissionFilter filter)
        {
            var result = await _getProgressSubmissionsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<ProgressSubmissionReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getProgressSubmissionDetailQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            return Ok(ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getProgressSubmissionCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] ProgressSubmissionCreateDto dto)
        {
            var result = await _createProgressSubmissionCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return StatusCode(result.StatusCode, ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getProgressSubmissionUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Submission not found", 404));
            return Ok(ApiResponse<ProgressSubmissionUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProgressSubmissionUpdateDto dto)
        {
            var result = await _updateProgressSubmissionCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<ProgressSubmissionReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteProgressSubmissionCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

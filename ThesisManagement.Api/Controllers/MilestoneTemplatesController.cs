using System;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.MilestoneTemplates;
using ThesisManagement.Api.Application.Query.MilestoneTemplates;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class MilestoneTemplatesController : BaseApiController
    {
        private readonly IGetMilestoneTemplatesListQuery _getMilestoneTemplatesListQuery;
        private readonly IGetMilestoneTemplateDetailQuery _getMilestoneTemplateDetailQuery;
        private readonly IGetMilestoneTemplateCreateQuery _getMilestoneTemplateCreateQuery;
        private readonly IGetMilestoneTemplateUpdateQuery _getMilestoneTemplateUpdateQuery;
        private readonly ICreateMilestoneTemplateCommand _createMilestoneTemplateCommand;
        private readonly IUpdateMilestoneTemplateCommand _updateMilestoneTemplateCommand;
        private readonly IDeleteMilestoneTemplateCommand _deleteMilestoneTemplateCommand;

        public MilestoneTemplatesController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMilestoneTemplatesListQuery getMilestoneTemplatesListQuery,
            IGetMilestoneTemplateDetailQuery getMilestoneTemplateDetailQuery,
            IGetMilestoneTemplateCreateQuery getMilestoneTemplateCreateQuery,
            IGetMilestoneTemplateUpdateQuery getMilestoneTemplateUpdateQuery,
            ICreateMilestoneTemplateCommand createMilestoneTemplateCommand,
            IUpdateMilestoneTemplateCommand updateMilestoneTemplateCommand,
            IDeleteMilestoneTemplateCommand deleteMilestoneTemplateCommand) : base(uow, codeGen, mapper)
        {
            _getMilestoneTemplatesListQuery = getMilestoneTemplatesListQuery;
            _getMilestoneTemplateDetailQuery = getMilestoneTemplateDetailQuery;
            _getMilestoneTemplateCreateQuery = getMilestoneTemplateCreateQuery;
            _getMilestoneTemplateUpdateQuery = getMilestoneTemplateUpdateQuery;
            _createMilestoneTemplateCommand = createMilestoneTemplateCommand;
            _updateMilestoneTemplateCommand = updateMilestoneTemplateCommand;
            _deleteMilestoneTemplateCommand = deleteMilestoneTemplateCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] MilestoneTemplateFilter filter)
        {
            var result = await _getMilestoneTemplatesListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<MilestoneTemplateReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getMilestoneTemplateDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            return Ok(ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getMilestoneTemplateCreateQuery.Execute();
            return Ok(ApiResponse<MilestoneTemplateCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] MilestoneTemplateCreateDto dto)
        {
            var result = await _createMilestoneTemplateCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getMilestoneTemplateUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Milestone template not found", 404));

            return Ok(ApiResponse<MilestoneTemplateUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MilestoneTemplateUpdateDto dto)
        {
            var result = await _updateMilestoneTemplateCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<MilestoneTemplateReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteMilestoneTemplateCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

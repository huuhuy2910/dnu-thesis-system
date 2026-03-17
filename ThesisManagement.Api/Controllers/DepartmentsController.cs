using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Departments;
using ThesisManagement.Api.Application.Query.Departments;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Departments.Command;
using ThesisManagement.Api.DTOs.Departments.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class DepartmentsController : BaseApiController
    {
        private readonly IGetDepartmentsListQuery _getDepartmentsListQuery;
        private readonly IGetDepartmentDetailQuery _getDepartmentDetailQuery;
        private readonly IGetDepartmentCreateQuery _getDepartmentCreateQuery;
        private readonly IGetDepartmentUpdateQuery _getDepartmentUpdateQuery;
        private readonly ICreateDepartmentCommand _createDepartmentCommand;
        private readonly IUpdateDepartmentCommand _updateDepartmentCommand;
        private readonly IDeleteDepartmentCommand _deleteDepartmentCommand;

        public DepartmentsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDepartmentsListQuery getDepartmentsListQuery,
            IGetDepartmentDetailQuery getDepartmentDetailQuery,
            IGetDepartmentCreateQuery getDepartmentCreateQuery,
            IGetDepartmentUpdateQuery getDepartmentUpdateQuery,
            ICreateDepartmentCommand createDepartmentCommand,
            IUpdateDepartmentCommand updateDepartmentCommand,
            IDeleteDepartmentCommand deleteDepartmentCommand) : base(uow, codeGen, mapper)
        {
            _getDepartmentsListQuery = getDepartmentsListQuery;
            _getDepartmentDetailQuery = getDepartmentDetailQuery;
            _getDepartmentCreateQuery = getDepartmentCreateQuery;
            _getDepartmentUpdateQuery = getDepartmentUpdateQuery;
            _createDepartmentCommand = createDepartmentCommand;
            _updateDepartmentCommand = updateDepartmentCommand;
            _deleteDepartmentCommand = deleteDepartmentCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DepartmentFilter filter)
        {
            var result = await _getDepartmentsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DepartmentReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getDepartmentDetailQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));
            return Ok(ApiResponse<DepartmentReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getDepartmentCreateQuery.Execute();
            return Ok(ApiResponse<object>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DepartmentCreateDto dto)
        {
            var result = await _createDepartmentCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<DepartmentReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getDepartmentUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Department not found", 404));
            return Ok(ApiResponse<DepartmentUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentUpdateDto dto)
        {
            var result = await _updateDepartmentCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<DepartmentReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteDepartmentCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(null));
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.DefenseTermStudents;
using ThesisManagement.Api.Application.Query.DefenseTermStudents;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseTermStudentsController : BaseApiController
    {
        private readonly IGetDefenseTermStudentsListQuery _getDefenseTermStudentsListQuery;
        private readonly IGetDefenseTermStudentDetailQuery _getDefenseTermStudentDetailQuery;
        private readonly IGetDefenseTermStudentCreateQuery _getDefenseTermStudentCreateQuery;
        private readonly IGetDefenseTermStudentUpdateQuery _getDefenseTermStudentUpdateQuery;
        private readonly ICreateDefenseTermStudentCommand _createDefenseTermStudentCommand;
        private readonly IUpdateDefenseTermStudentCommand _updateDefenseTermStudentCommand;
        private readonly IDeleteDefenseTermStudentCommand _deleteDefenseTermStudentCommand;

        public DefenseTermStudentsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseTermStudentsListQuery getDefenseTermStudentsListQuery,
            IGetDefenseTermStudentDetailQuery getDefenseTermStudentDetailQuery,
            IGetDefenseTermStudentCreateQuery getDefenseTermStudentCreateQuery,
            IGetDefenseTermStudentUpdateQuery getDefenseTermStudentUpdateQuery,
            ICreateDefenseTermStudentCommand createDefenseTermStudentCommand,
            IUpdateDefenseTermStudentCommand updateDefenseTermStudentCommand,
            IDeleteDefenseTermStudentCommand deleteDefenseTermStudentCommand) : base(uow, codeGen, mapper)
        {
            _getDefenseTermStudentsListQuery = getDefenseTermStudentsListQuery;
            _getDefenseTermStudentDetailQuery = getDefenseTermStudentDetailQuery;
            _getDefenseTermStudentCreateQuery = getDefenseTermStudentCreateQuery;
            _getDefenseTermStudentUpdateQuery = getDefenseTermStudentUpdateQuery;
            _createDefenseTermStudentCommand = createDefenseTermStudentCommand;
            _updateDefenseTermStudentCommand = updateDefenseTermStudentCommand;
            _deleteDefenseTermStudentCommand = deleteDefenseTermStudentCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseTermStudentFilter filter)
        {
            var result = await _getDefenseTermStudentsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseTermStudentReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDefenseTermStudentDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTermStudent not found", 404));

            return Ok(ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
            => Ok(ApiResponse<DefenseTermStudentCreateDto>.SuccessResponse(_getDefenseTermStudentCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseTermStudentCreateDto dto)
        {
            var result = await _createDefenseTermStudentCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getDefenseTermStudentUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTermStudent not found", 404));

            return Ok(ApiResponse<DefenseTermStudentUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseTermStudentUpdateDto dto)
        {
            var result = await _updateDefenseTermStudentCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteDefenseTermStudentCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}
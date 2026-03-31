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
        private readonly IGetDefenseTermStudentsListQuery _getListQuery;
        private readonly IGetDefenseTermStudentDetailQuery _getDetailQuery;
        private readonly IGetDefenseTermStudentCreateQuery _getCreateQuery;
        private readonly IGetDefenseTermStudentUpdateQuery _getUpdateQuery;
        private readonly ICreateDefenseTermStudentCommand _createCommand;
        private readonly IUpdateDefenseTermStudentCommand _updateCommand;
        private readonly IDeleteDefenseTermStudentCommand _deleteCommand;

        public DefenseTermStudentsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseTermStudentsListQuery getListQuery,
            IGetDefenseTermStudentDetailQuery getDetailQuery,
            IGetDefenseTermStudentCreateQuery getCreateQuery,
            IGetDefenseTermStudentUpdateQuery getUpdateQuery,
            ICreateDefenseTermStudentCommand createCommand,
            IUpdateDefenseTermStudentCommand updateCommand,
            IDeleteDefenseTermStudentCommand deleteCommand) : base(uow, codeGen, mapper)
        {
            _getListQuery = getListQuery;
            _getDetailQuery = getDetailQuery;
            _getCreateQuery = getCreateQuery;
            _getUpdateQuery = getUpdateQuery;
            _createCommand = createCommand;
            _updateCommand = updateCommand;
            _deleteCommand = deleteCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseTermStudentFilter filter)
        {
            var result = await _getListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseTermStudentReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDetailQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("DefenseTermStudent not found", 404));
            return Ok(ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getCreateQuery.Execute();
            return Ok(ApiResponse<DefenseTermStudentCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseTermStudentCreateDto dto)
        {
            var result = await _createCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("DefenseTermStudent not found", 404));
            return Ok(ApiResponse<DefenseTermStudentUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseTermStudentUpdateDto dto)
        {
            var result = await _updateCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<DefenseTermStudentReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<string>.SuccessResponse(result.Data));
        }
    }
}
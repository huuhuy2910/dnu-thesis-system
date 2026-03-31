using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.DefenseTermLecturers;
using ThesisManagement.Api.Application.Query.DefenseTermLecturers;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefenseTermLecturers.Command;
using ThesisManagement.Api.DTOs.DefenseTermLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class DefenseTermLecturersController : BaseApiController
    {
        private readonly IGetDefenseTermLecturersListQuery _getListQuery;
        private readonly IGetDefenseTermLecturerDetailQuery _getDetailQuery;
        private readonly IGetDefenseTermLecturerCreateQuery _getCreateQuery;
        private readonly IGetDefenseTermLecturerUpdateQuery _getUpdateQuery;
        private readonly ICreateDefenseTermLecturerCommand _createCommand;
        private readonly IUpdateDefenseTermLecturerCommand _updateCommand;
        private readonly IDeleteDefenseTermLecturerCommand _deleteCommand;

        public DefenseTermLecturersController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseTermLecturersListQuery getListQuery,
            IGetDefenseTermLecturerDetailQuery getDetailQuery,
            IGetDefenseTermLecturerCreateQuery getCreateQuery,
            IGetDefenseTermLecturerUpdateQuery getUpdateQuery,
            ICreateDefenseTermLecturerCommand createCommand,
            IUpdateDefenseTermLecturerCommand updateCommand,
            IDeleteDefenseTermLecturerCommand deleteCommand) : base(uow, codeGen, mapper)
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
        public async Task<IActionResult> GetList([FromQuery] DefenseTermLecturerFilter filter)
        {
            var result = await _getListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseTermLecturerReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDetailQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("DefenseTermLecturer not found", 404));
            return Ok(ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getCreateQuery.Execute();
            return Ok(ApiResponse<DefenseTermLecturerCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseTermLecturerCreateDto dto)
        {
            var result = await _createCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("DefenseTermLecturer not found", 404));
            return Ok(ApiResponse<DefenseTermLecturerUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseTermLecturerUpdateDto dto)
        {
            var result = await _updateCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(result.Data));
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
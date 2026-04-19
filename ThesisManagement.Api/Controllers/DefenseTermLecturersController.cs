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
        private readonly IGetDefenseTermLecturersListQuery _getDefenseTermLecturersListQuery;
        private readonly IGetDefenseTermLecturerDetailQuery _getDefenseTermLecturerDetailQuery;
        private readonly IGetDefenseTermLecturerCreateQuery _getDefenseTermLecturerCreateQuery;
        private readonly IGetDefenseTermLecturerUpdateQuery _getDefenseTermLecturerUpdateQuery;
        private readonly ICreateDefenseTermLecturerCommand _createDefenseTermLecturerCommand;
        private readonly IUpdateDefenseTermLecturerCommand _updateDefenseTermLecturerCommand;
        private readonly IDeleteDefenseTermLecturerCommand _deleteDefenseTermLecturerCommand;

        public DefenseTermLecturersController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetDefenseTermLecturersListQuery getDefenseTermLecturersListQuery,
            IGetDefenseTermLecturerDetailQuery getDefenseTermLecturerDetailQuery,
            IGetDefenseTermLecturerCreateQuery getDefenseTermLecturerCreateQuery,
            IGetDefenseTermLecturerUpdateQuery getDefenseTermLecturerUpdateQuery,
            ICreateDefenseTermLecturerCommand createDefenseTermLecturerCommand,
            IUpdateDefenseTermLecturerCommand updateDefenseTermLecturerCommand,
            IDeleteDefenseTermLecturerCommand deleteDefenseTermLecturerCommand) : base(uow, codeGen, mapper)
        {
            _getDefenseTermLecturersListQuery = getDefenseTermLecturersListQuery;
            _getDefenseTermLecturerDetailQuery = getDefenseTermLecturerDetailQuery;
            _getDefenseTermLecturerCreateQuery = getDefenseTermLecturerCreateQuery;
            _getDefenseTermLecturerUpdateQuery = getDefenseTermLecturerUpdateQuery;
            _createDefenseTermLecturerCommand = createDefenseTermLecturerCommand;
            _updateDefenseTermLecturerCommand = updateDefenseTermLecturerCommand;
            _deleteDefenseTermLecturerCommand = deleteDefenseTermLecturerCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] DefenseTermLecturerFilter filter)
        {
            var result = await _getDefenseTermLecturersListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<DefenseTermLecturerReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getDefenseTermLecturerDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTermLecturer not found", 404));

            return Ok(ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
            => Ok(ApiResponse<DefenseTermLecturerCreateDto>.SuccessResponse(_getDefenseTermLecturerCreateQuery.Execute()));

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] DefenseTermLecturerCreateDto dto)
        {
            var result = await _createDefenseTermLecturerCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getDefenseTermLecturerUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("DefenseTermLecturer not found", 404));

            return Ok(ApiResponse<DefenseTermLecturerUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DefenseTermLecturerUpdateDto dto)
        {
            var result = await _updateDefenseTermLecturerCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<DefenseTermLecturerReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteDefenseTermLecturerCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}
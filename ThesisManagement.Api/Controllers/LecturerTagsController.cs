using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.LecturerTags;
using ThesisManagement.Api.Application.Query.LecturerTags;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.LecturerTags.Command;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class LecturerTagsController : BaseApiController
    {
        private readonly IGetLecturerTagsListQuery _getLecturerTagsListQuery;
        private readonly IGetLecturerTagCreateQuery _getLecturerTagCreateQuery;
        private readonly IGetLecturerTagUpdateQuery _getLecturerTagUpdateQuery;
        private readonly IGetLecturerTagsByLecturerQuery _getLecturerTagsByLecturerQuery;
        private readonly IGetLecturerTagsByTagQuery _getLecturerTagsByTagQuery;
        private readonly ICreateLecturerTagCommand _createLecturerTagCommand;
        private readonly IUpdateLecturerTagCommand _updateLecturerTagCommand;
        private readonly IDeleteLecturerTagCommand _deleteLecturerTagCommand;

        public LecturerTagsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetLecturerTagsListQuery getLecturerTagsListQuery,
            IGetLecturerTagCreateQuery getLecturerTagCreateQuery,
            IGetLecturerTagUpdateQuery getLecturerTagUpdateQuery,
            IGetLecturerTagsByLecturerQuery getLecturerTagsByLecturerQuery,
            IGetLecturerTagsByTagQuery getLecturerTagsByTagQuery,
            ICreateLecturerTagCommand createLecturerTagCommand,
            IUpdateLecturerTagCommand updateLecturerTagCommand,
            IDeleteLecturerTagCommand deleteLecturerTagCommand) : base(uow, codeGen, mapper)
        {
            _getLecturerTagsListQuery = getLecturerTagsListQuery;
            _getLecturerTagCreateQuery = getLecturerTagCreateQuery;
            _getLecturerTagUpdateQuery = getLecturerTagUpdateQuery;
            _getLecturerTagsByLecturerQuery = getLecturerTagsByLecturerQuery;
            _getLecturerTagsByTagQuery = getLecturerTagsByTagQuery;
            _createLecturerTagCommand = createLecturerTagCommand;
            _updateLecturerTagCommand = updateLecturerTagCommand;
            _deleteLecturerTagCommand = deleteLecturerTagCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] LecturerTagFilter filter)
        {
            var result = await _getLecturerTagsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<LecturerTagReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getLecturerTagCreateQuery.Execute();
            return Ok(ApiResponse<LecturerTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] LecturerTagCreateDto dto)
        {
            var result = await _createLecturerTagCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<LecturerTagReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getLecturerTagUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("LecturerTag not found", 404));
            return Ok(ApiResponse<LecturerTagUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LecturerTagUpdateDto dto)
        {
            var result = await _updateLecturerTagCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<LecturerTagReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteLecturerTagCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<string>.SuccessResponse(result.Data));
        }

        [HttpGet("by-lecturer/{lecturerCode}")]
        public async Task<IActionResult> GetByLecturer(string lecturerCode)
        {
            var items = await _getLecturerTagsByLecturerQuery.ExecuteAsync(lecturerCode);
            return Ok(ApiResponse<List<LecturerTagReadDto>>.SuccessResponse(items));
        }

        [HttpGet("by-tag/{tagId}")]
        public async Task<IActionResult> GetByTag(int tagId)
        {
            var items = await _getLecturerTagsByTagQuery.ExecuteAsync(tagId);
            return Ok(ApiResponse<List<LecturerTagReadDto>>.SuccessResponse(items));
        }
    }
}

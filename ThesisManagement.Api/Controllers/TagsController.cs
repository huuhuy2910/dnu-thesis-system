using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Tags;
using ThesisManagement.Api.Application.Query.Tags;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Tags.Command;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TagsController : BaseApiController
    {
        private readonly IGetTagsListQuery _getTagsListQuery;
        private readonly IGetTagCreateQuery _getTagCreateQuery;
        private readonly IGetTagUpdateQuery _getTagUpdateQuery;
        private readonly IGetTagByCodeQuery _getTagByCodeQuery;
        private readonly ISearchTagsQuery _searchTagsQuery;
        private readonly ICreateTagCommand _createTagCommand;
        private readonly IUpdateTagCommand _updateTagCommand;
        private readonly IDeleteTagCommand _deleteTagCommand;

        public TagsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetTagsListQuery getTagsListQuery,
            IGetTagCreateQuery getTagCreateQuery,
            IGetTagUpdateQuery getTagUpdateQuery,
            IGetTagByCodeQuery getTagByCodeQuery,
            ISearchTagsQuery searchTagsQuery,
            ICreateTagCommand createTagCommand,
            IUpdateTagCommand updateTagCommand,
            IDeleteTagCommand deleteTagCommand) : base(uow, codeGen, mapper)
        {
            _getTagsListQuery = getTagsListQuery;
            _getTagCreateQuery = getTagCreateQuery;
            _getTagUpdateQuery = getTagUpdateQuery;
            _getTagByCodeQuery = getTagByCodeQuery;
            _searchTagsQuery = searchTagsQuery;
            _createTagCommand = createTagCommand;
            _updateTagCommand = updateTagCommand;
            _deleteTagCommand = deleteTagCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] TagFilter filter)
        {
            var result = await _getTagsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<TagReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getTagCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<TagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TagCreateDto dto)
        {
            var result = await _createTagCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TagReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getTagUpdateQuery.ExecuteAsync(id);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));
            return Ok(ApiResponse<TagUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TagUpdateDto dto)
        {
            var result = await _updateTagCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TagReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteTagCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<string>.SuccessResponse(result.Data));
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            var items = await _searchTagsQuery.ExecuteAsync(q);
            return Ok(ApiResponse<List<TagReadDto>>.SuccessResponse(items));
        }

        [HttpGet("get-by-code/{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var dto = await _getTagByCodeQuery.ExecuteAsync(code);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("Tag not found", 404));
            return Ok(ApiResponse<TagReadDto>.SuccessResponse(dto));
        }
    }
}

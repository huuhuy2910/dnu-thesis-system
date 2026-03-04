using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.TopicTags;
using ThesisManagement.Api.Application.Query.TopicTags;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.TopicTags.Command;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TopicTagsController : BaseApiController
    {
        private readonly IGetTopicTagsListQuery _getTopicTagsListQuery;
        private readonly IGetTopicTagCreateQuery _getTopicTagCreateQuery;
        private readonly IGetTopicTagsByTopicQuery _getTopicTagsByTopicQuery;
        private readonly IGetTopicTagsByCatalogTopicQuery _getTopicTagsByCatalogTopicQuery;
        private readonly IGetTopicTagUpdateByTopicCodeQuery _getTopicTagUpdateByTopicCodeQuery;
        private readonly ICreateTopicTagCommand _createTopicTagCommand;
        private readonly ICreateTopicTagByTopicCodeCommand _createTopicTagByTopicCodeCommand;
        private readonly IUpdateTopicTagByTopicCodeCommand _updateTopicTagByTopicCodeCommand;
        private readonly IDeleteTopicTagByTopicCodeCommand _deleteTopicTagByTopicCodeCommand;

        public TopicTagsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetTopicTagsListQuery getTopicTagsListQuery,
            IGetTopicTagCreateQuery getTopicTagCreateQuery,
            IGetTopicTagsByTopicQuery getTopicTagsByTopicQuery,
            IGetTopicTagsByCatalogTopicQuery getTopicTagsByCatalogTopicQuery,
            IGetTopicTagUpdateByTopicCodeQuery getTopicTagUpdateByTopicCodeQuery,
            ICreateTopicTagCommand createTopicTagCommand,
            ICreateTopicTagByTopicCodeCommand createTopicTagByTopicCodeCommand,
            IUpdateTopicTagByTopicCodeCommand updateTopicTagByTopicCodeCommand,
            IDeleteTopicTagByTopicCodeCommand deleteTopicTagByTopicCodeCommand) : base(uow, codeGen, mapper)
        {
            _getTopicTagsListQuery = getTopicTagsListQuery;
            _getTopicTagCreateQuery = getTopicTagCreateQuery;
            _getTopicTagsByTopicQuery = getTopicTagsByTopicQuery;
            _getTopicTagsByCatalogTopicQuery = getTopicTagsByCatalogTopicQuery;
            _getTopicTagUpdateByTopicCodeQuery = getTopicTagUpdateByTopicCodeQuery;
            _createTopicTagCommand = createTopicTagCommand;
            _createTopicTagByTopicCodeCommand = createTopicTagByTopicCodeCommand;
            _updateTopicTagByTopicCodeCommand = updateTopicTagByTopicCodeCommand;
            _deleteTopicTagByTopicCodeCommand = deleteTopicTagByTopicCodeCommand;
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetList([FromQuery] TopicTagFilter filter)
        {
            var result = await _getTopicTagsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getTopicTagCreateQuery.Execute();
            return Ok(ApiResponse<TopicTagCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicTagCreateDto dto)
        {
            var result = await _createTopicTagCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(result.Data));
        }


        [HttpGet("by-topic/{topicCode}")]
        public async Task<IActionResult> GetByTopic(string topicCode)
        {
            var dtos = await _getTopicTagsByTopicQuery.ExecuteAsync(topicCode);
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(dtos));
        }

        [HttpGet("by-catalog-topic/{catalogTopicCode}")]
        public async Task<IActionResult> GetByCatalogTopic(string catalogTopicCode)
        {
            var dtos = await _getTopicTagsByCatalogTopicQuery.ExecuteAsync(catalogTopicCode);
            return Ok(ApiResponse<IEnumerable<TopicTagReadDto>>.SuccessResponse(dtos));
        }

        

        // New endpoints with topicCode in route
        [HttpPost("create/{topicCode}")]
        public async Task<IActionResult> CreateByTopicCode(string topicCode, [FromBody] TopicTagCreateDto dto)
        {
            var result = await _createTopicTagByTopicCodeCommand.ExecuteAsync(topicCode, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> GetUpdateByTopicCode(string topicCode, int topicTagID)
        {
            var dto = await _getTopicTagUpdateByTopicCodeQuery.ExecuteAsync(topicCode, topicTagID);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("TopicTag not found", 404));
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> UpdateByTopicCode(string topicCode, int topicTagID, [FromBody] TopicTagUpdateDto dto)
        {
            var result = await _updateTopicTagByTopicCodeCommand.ExecuteAsync(topicCode, topicTagID, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<TopicTagReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{topicCode}/{topicTagID}")]
        public async Task<IActionResult> DeleteByTopicCode(string topicCode, int topicTagID)
        {
            var result = await _deleteTopicTagByTopicCodeCommand.ExecuteAsync(topicCode, topicTagID);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<string>.SuccessResponse(result.Data));
        }
    }
}

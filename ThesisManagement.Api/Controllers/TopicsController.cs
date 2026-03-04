using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Topics;
using ThesisManagement.Api.Application.Query.Topics;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Topics.Command;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TopicsController : BaseApiController
    {
        private readonly IGetTopicsListQuery _getTopicsListQuery;
        private readonly IGetTopicDetailQuery _getTopicDetailQuery;
        private readonly IGetTopicCreateQuery _getTopicCreateQuery;
        private readonly IGetTopicUpdateQuery _getTopicUpdateQuery;
        private readonly ICreateTopicCommand _createTopicCommand;
        private readonly IUpdateTopicCommand _updateTopicCommand;
        private readonly IDeleteTopicCommand _deleteTopicCommand;

        public TopicsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetTopicsListQuery getTopicsListQuery,
            IGetTopicDetailQuery getTopicDetailQuery,
            IGetTopicCreateQuery getTopicCreateQuery,
            IGetTopicUpdateQuery getTopicUpdateQuery,
            ICreateTopicCommand createTopicCommand,
            IUpdateTopicCommand updateTopicCommand,
            IDeleteTopicCommand deleteTopicCommand) : base(uow, codeGen, mapper)
        {
            _getTopicsListQuery = getTopicsListQuery;
            _getTopicDetailQuery = getTopicDetailQuery;
            _getTopicCreateQuery = getTopicCreateQuery;
            _getTopicUpdateQuery = getTopicUpdateQuery;
            _createTopicCommand = createTopicCommand;
            _updateTopicCommand = updateTopicCommand;
            _deleteTopicCommand = deleteTopicCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] TopicFilter filter)
        {
            var result = await _getTopicsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<TopicReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{code}")]
        public async Task<IActionResult> GetDetail(string code)
        {
            var dto = await _getTopicDetailQuery.ExecuteAsync(code);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Topic not found", 404));

            return Ok(ApiResponse<TopicReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreate()
        {
            var sample = await _getTopicCreateQuery.ExecuteAsync();
            return Ok(ApiResponse<TopicCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicCreateDto dto)
        {
            var result = await _createTopicCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(201, ApiResponse<TopicReadDto>.SuccessResponse(result.Data, 1, 201));
        }

        [HttpGet("get-update/{id}")]
        public async Task<IActionResult> GetUpdate(int id)
        {
            var dto = await _getTopicUpdateQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Topic not found", 404));

            return Ok(ApiResponse<TopicUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TopicUpdateDto dto)
        {
            var result = await _updateTopicCommand.ExecuteAsync(id, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _deleteTopicCommand.ExecuteAsync(id);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}

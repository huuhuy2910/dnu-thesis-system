using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.TopicLecturers;
using ThesisManagement.Api.Application.Query.TopicLecturers;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.TopicLecturers.Command;
using ThesisManagement.Api.DTOs.TopicLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class TopicLecturersController : BaseApiController
    {
        private readonly IGetTopicLecturersListQuery _getTopicLecturersListQuery;
        private readonly IGetTopicLecturerDetailQuery _getTopicLecturerDetailQuery;
        private readonly IGetTopicLecturerCreateQuery _getTopicLecturerCreateQuery;
        private readonly IGetTopicLecturerUpdateQuery _getTopicLecturerUpdateQuery;
        private readonly IGetTopicLecturersByTopicQuery _getTopicLecturersByTopicQuery;
        private readonly IGetTopicLecturersByLecturerQuery _getTopicLecturersByLecturerQuery;
        private readonly ICreateTopicLecturerCommand _createTopicLecturerCommand;
        private readonly IUpdateTopicLecturerCommand _updateTopicLecturerCommand;
        private readonly IDeleteTopicLecturerCommand _deleteTopicLecturerCommand;

        public TopicLecturersController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetTopicLecturersListQuery getTopicLecturersListQuery,
            IGetTopicLecturerDetailQuery getTopicLecturerDetailQuery,
            IGetTopicLecturerCreateQuery getTopicLecturerCreateQuery,
            IGetTopicLecturerUpdateQuery getTopicLecturerUpdateQuery,
            IGetTopicLecturersByTopicQuery getTopicLecturersByTopicQuery,
            IGetTopicLecturersByLecturerQuery getTopicLecturersByLecturerQuery,
            ICreateTopicLecturerCommand createTopicLecturerCommand,
            IUpdateTopicLecturerCommand updateTopicLecturerCommand,
            IDeleteTopicLecturerCommand deleteTopicLecturerCommand) : base(uow, codeGen, mapper)
        {
            _getTopicLecturersListQuery = getTopicLecturersListQuery;
            _getTopicLecturerDetailQuery = getTopicLecturerDetailQuery;
            _getTopicLecturerCreateQuery = getTopicLecturerCreateQuery;
            _getTopicLecturerUpdateQuery = getTopicLecturerUpdateQuery;
            _getTopicLecturersByTopicQuery = getTopicLecturersByTopicQuery;
            _getTopicLecturersByLecturerQuery = getTopicLecturersByLecturerQuery;
            _createTopicLecturerCommand = createTopicLecturerCommand;
            _updateTopicLecturerCommand = updateTopicLecturerCommand;
            _deleteTopicLecturerCommand = deleteTopicLecturerCommand;
        }

        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] TopicLecturerFilter filter)
        {
            var result = await _getTopicLecturersListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("get-detail/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> GetDetail(int topicId, int lecturerProfileId)
        {
            var dto = await _getTopicLecturerDetailQuery.ExecuteAsync(topicId, lecturerProfileId);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));
            return Ok(ApiResponse<TopicLecturerReadDto>.SuccessResponse(dto));
        }

        [HttpGet("get-create")]
        public IActionResult GetCreate()
        {
            var sample = _getTopicLecturerCreateQuery.Execute();
            return Ok(ApiResponse<TopicLecturerCreateDto>.SuccessResponse(sample));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicLecturerCreateDto dto)
        {
            var result = await _createTopicLecturerCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<TopicLecturerCreateDto>.SuccessResponse(result.Data));
        }

        [HttpGet("get-update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> GetUpdate(int topicId, int lecturerProfileId)
        {
            var dto = await _getTopicLecturerUpdateQuery.ExecuteAsync(topicId, lecturerProfileId);
            if (dto == null) return NotFound(ApiResponse<object>.Fail("TopicLecturer not found", 404));
            return Ok(ApiResponse<TopicLecturerUpdateDto>.SuccessResponse(dto));
        }

        [HttpPut("update/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> Update(int topicId, int lecturerProfileId, [FromBody] TopicLecturerUpdateDto dto)
        {
            var result = await _updateTopicLecturerCommand.ExecuteAsync(topicId, lecturerProfileId, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<TopicLecturerReadDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("delete/{topicId}/{lecturerProfileId}")]
        public async Task<IActionResult> Delete(int topicId, int lecturerProfileId)
        {
            var result = await _deleteTopicLecturerCommand.ExecuteAsync(topicId, lecturerProfileId);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));
            return Ok(ApiResponse<object>.SuccessResponse(null));
        }

        [HttpGet("by-topic/{topicId}")]
        public async Task<IActionResult> GetByTopic(int topicId)
        {
            var result = await _getTopicLecturersByTopicQuery.ExecuteAsync(topicId);
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(result.Items, result.Count));
        }

        [HttpGet("by-lecturer/{lecturerProfileId}")]
        public async Task<IActionResult> GetByLecturer(int lecturerProfileId)
        {
            var result = await _getTopicLecturersByLecturerQuery.ExecuteAsync(lecturerProfileId);
            return Ok(ApiResponse<IEnumerable<TopicLecturerReadDto>>.SuccessResponse(result.Items, result.Count));
        }
    }
}
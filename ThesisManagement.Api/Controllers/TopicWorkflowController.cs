using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Workflows;
using ThesisManagement.Api.Application.Query.Workflows;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Workflows.Command;
using ThesisManagement.Api.DTOs.Workflows.Query;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/workflows/topics")]
    public class TopicWorkflowController : ControllerBase
    {
        private readonly IGetTopicWorkflowAuditHistoryQuery _getAuditHistoryQuery;
        private readonly IGetTopicWorkflowTimelineByTopicIdQuery _getTimelineByTopicIdQuery;
        private readonly IGetTopicWorkflowTimelineByTopicCodeQuery _getTimelineByTopicCodeQuery;
        private readonly IGetTopicWorkflowDetailQuery _getDetailQuery;
        private readonly ISubmitTopicWorkflowCommand _submitCommand;
        private readonly IResubmitTopicWorkflowCommand _resubmitCommand;
        private readonly IDecideTopicWorkflowCommand _decideCommand;
        private readonly IRollbackStudentWorkflowTestDataCommand _rollbackCommand;

        public TopicWorkflowController(
            IGetTopicWorkflowAuditHistoryQuery getAuditHistoryQuery,
            IGetTopicWorkflowTimelineByTopicIdQuery getTimelineByTopicIdQuery,
            IGetTopicWorkflowTimelineByTopicCodeQuery getTimelineByTopicCodeQuery,
            IGetTopicWorkflowDetailQuery getDetailQuery,
            ISubmitTopicWorkflowCommand submitCommand,
            IResubmitTopicWorkflowCommand resubmitCommand,
            IDecideTopicWorkflowCommand decideCommand,
            IRollbackStudentWorkflowTestDataCommand rollbackCommand)
        {
            _getAuditHistoryQuery = getAuditHistoryQuery;
            _getTimelineByTopicIdQuery = getTimelineByTopicIdQuery;
            _getTimelineByTopicCodeQuery = getTimelineByTopicCodeQuery;
            _getDetailQuery = getDetailQuery;
            _submitCommand = submitCommand;
            _resubmitCommand = resubmitCommand;
            _decideCommand = decideCommand;
            _rollbackCommand = rollbackCommand;
        }

        [HttpGet("audits")]
        public async Task<IActionResult> Audits([FromQuery] TopicWorkflowAuditFilter filter)
        {
            var result = await _getAuditHistoryQuery.ExecuteAsync(filter);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<IEnumerable<TopicWorkflowAuditReadDto>>.SuccessResponse(result.Data?.Items, result.Data?.TotalCount ?? 0));
        }

        [HttpGet("timeline/{topicId:int}")]
        public async Task<IActionResult> Timeline(int topicId)
        {
            var result = await _getTimelineByTopicIdQuery.ExecuteAsync(topicId);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicWorkflowTimelineDto>.SuccessResponse(result.Data));
        }

        [HttpGet("timeline-by-code/{topicCode}")]
        public async Task<IActionResult> TimelineByCode(string topicCode)
        {
            var result = await _getTimelineByTopicCodeQuery.ExecuteAsync(topicCode);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicWorkflowTimelineDto>.SuccessResponse(result.Data));
        }

        [HttpGet("detail/{topicId:int}")]
        public async Task<IActionResult> Detail(int topicId)
        {
            var result = await _getDetailQuery.ExecuteAsync(topicId);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicWorkflowDetailDto>.SuccessResponse(result.Data));
        }

        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] TopicResubmitWorkflowRequestDto request)
        {
            var result = await _submitCommand.ExecuteAsync(request);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<TopicWorkflowResultDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpPost("resubmit")]
        public async Task<IActionResult> Resubmit([FromBody] TopicResubmitWorkflowRequestDto request)
        {
            var result = await _resubmitCommand.ExecuteAsync(request);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<TopicWorkflowResultDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpPost("decision/{topicId:int}")]
        public async Task<IActionResult> Decide(int topicId, [FromBody] TopicDecisionWorkflowRequestDto request)
        {
            var result = await _decideCommand.ExecuteAsync(topicId, request);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicWorkflowResultDto>.SuccessResponse(result.Data));
        }

        [HttpDelete("rollback-my-test-data")]
        public async Task<IActionResult> RollbackMyTestData([FromQuery] string? topicCode)
        {
            var result = await _rollbackCommand.ExecuteAsync(topicCode);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<TopicWorkflowRollbackResultDto>.SuccessResponse(result.Data));
        }
    }
}

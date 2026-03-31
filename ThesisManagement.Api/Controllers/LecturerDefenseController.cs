using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Command.DefenseExecution;
using ThesisManagement.Api.Application.Query.DefenseExecution;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/v1/defense-periods/{periodId:int}/lecturer")]
    [Authorize(Roles = "Lecturer,Head,Secretary")]
    public class LecturerDefenseController : BaseApiController
    {
        public class SubmitScoreRequest
        {
            public int CommitteeId { get; set; }
            public int AssignmentId { get; set; }
            public decimal Score { get; set; }
            public string? Comment { get; set; }
        }

        public class ChairScoreActionRequest
        {
            public int CommitteeId { get; set; }
            public int AssignmentId { get; set; }
            public string? Reason { get; set; }
        }

        public class ScoreActionRequest
        {
            public string Action { get; set; } = string.Empty;
            public int CommitteeId { get; set; }
            public int AssignmentId { get; set; }
            public decimal? Score { get; set; }
            public string? Comment { get; set; }
            public string? Reason { get; set; }
        }

        private readonly IGetLecturerCommitteesQueryV2 _getCommitteesQuery;
        private readonly IGetLecturerMinutesQuery _getMinutesQuery;
        private readonly ISaveLecturerMinuteCommand _saveMinuteCommand;
        private readonly ISubmitLecturerIndependentScoreCommand _submitScoreCommand;
        private readonly IRequestReopenScoreCommand _reopenScoreCommand;
        private readonly ILockLecturerSessionCommand _lockSessionCommand;
        private readonly IGetLecturerRevisionQueueQuery _revisionQueueQuery;
        private readonly IApproveRevisionByLecturerCommand _approveRevisionCommand;
        private readonly IRejectRevisionByLecturerCommand _rejectRevisionCommand;
        private readonly IGetScoringMatrixQuery _scoringMatrixQuery;
        private readonly IGetScoringProgressQuery _scoringProgressQuery;
        private readonly IGetScoringAlertsQuery _scoringAlertsQuery;
        private readonly ILogger<LecturerDefenseController> _logger;

        public LecturerDefenseController(
            Services.IUnitOfWork uow,
            Services.ICodeGenerator codeGen,
            AutoMapper.IMapper mapper,
            IGetLecturerCommitteesQueryV2 getCommitteesQuery,
            IGetLecturerMinutesQuery getMinutesQuery,
            ISaveLecturerMinuteCommand saveMinuteCommand,
            ISubmitLecturerIndependentScoreCommand submitScoreCommand,
            IRequestReopenScoreCommand reopenScoreCommand,
            ILockLecturerSessionCommand lockSessionCommand,
            IGetLecturerRevisionQueueQuery revisionQueueQuery,
            IApproveRevisionByLecturerCommand approveRevisionCommand,
            IRejectRevisionByLecturerCommand rejectRevisionCommand,
            IGetScoringMatrixQuery scoringMatrixQuery,
            IGetScoringProgressQuery scoringProgressQuery,
            IGetScoringAlertsQuery scoringAlertsQuery,
            ILogger<LecturerDefenseController> logger) : base(uow, codeGen, mapper)
        {
            _getCommitteesQuery = getCommitteesQuery;
            _getMinutesQuery = getMinutesQuery;
            _saveMinuteCommand = saveMinuteCommand;
            _submitScoreCommand = submitScoreCommand;
            _reopenScoreCommand = reopenScoreCommand;
            _lockSessionCommand = lockSessionCommand;
            _revisionQueueQuery = revisionQueueQuery;
            _approveRevisionCommand = approveRevisionCommand;
            _rejectRevisionCommand = rejectRevisionCommand;
            _scoringMatrixQuery = scoringMatrixQuery;
            _scoringProgressQuery = scoringProgressQuery;
            _scoringAlertsQuery = scoringAlertsQuery;
            _logger = logger;
        }

        private void MarkLegacyEndpoint(string legacyPath, string canonicalPath)
        {
            Response.Headers["X-API-Version"] = "2026-03";
            Response.Headers["Deprecation"] = "true";
            Response.Headers["Sunset"] = "Tue, 30 Jun 2026 23:59:59 GMT";
            Response.Headers["Link"] = $"<{canonicalPath}>; rel=\"alternate\"";
            Response.Headers["Warning"] = $"299 - \"Deprecated API: '{legacyPath}'. Migrate to '{canonicalPath}' before sunset.\"";

            _logger.LogWarning(
                "Deprecated API endpoint called. Legacy={LegacyPath}, Canonical={CanonicalPath}, User={UserCode}, TraceId={TraceId}",
                legacyPath,
                canonicalPath,
                GetRequestUserCode(),
                HttpContext.TraceIdentifier);
        }

        [HttpGet("committees")]
        public async Task<ActionResult<ApiResponse<object>>> GetCommittees(int periodId)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _getCommitteesQuery.ExecuteAsync(lecturerCode, periodId);
            return FromResult(result);
        }

        [HttpGet("committees/{id:int}/minutes")]
        public async Task<ActionResult<ApiResponse<List<LecturerCommitteeMinuteDto>>>> GetMinutes(int periodId, int id)
        {
            var result = await _getMinutesQuery.ExecuteAsync(id, periodId);
            return FromResult(result);
        }

        [HttpPut("committees/{id:int}/minutes")]
        public async Task<ActionResult<ApiResponse<bool>>> SaveMinutes(int periodId, int id, [FromBody] UpdateLecturerMinutesDto request)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, ApiResponse<bool>.Fail(guard.Message ?? "Không thể truy vấn biên bản hội đồng.", guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard.Errors, guard.Code));
            }

            var result = await _saveMinuteCommand.ExecuteAsync(id, request, CurrentUserId);
            return FromResult(result);
        }

        [HttpPost("committees/{id:int}/scores/independent")]
        public async Task<ActionResult<ApiResponse<bool>>> SubmitIndependentScore(int periodId, int id, [FromBody] LecturerScoreSubmitDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, ApiResponse<bool>.Fail(guard.Message ?? "Không thể truy vấn biên bản hội đồng.", guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard.Errors, guard.Code));
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _submitScoreCommand.ExecuteAsync(id, request, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("scores/submit")]
        public async Task<ActionResult<ApiResponse<bool>>> SubmitScore(int periodId, [FromBody] SubmitScoreRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            MarkLegacyEndpoint(
                $"/api/v1/defense-periods/{periodId}/lecturer/scores/submit",
                $"/api/v1/defense-periods/{periodId}/lecturer/committees/{{id}}/scores/independent");

            var dto = new LecturerScoreSubmitDto
            {
                AssignmentId = request.AssignmentId,
                Score = request.Score,
                Comment = request.Comment
            };

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _submitScoreCommand.ExecuteAsync(request.CommitteeId, dto, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("scores/action")]
        public async Task<ActionResult<ApiResponse<bool>>> ScoreAction(int periodId, [FromBody] ScoreActionRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            MarkLegacyEndpoint(
                $"/api/v1/defense-periods/{periodId}/lecturer/scores/action",
                $"/api/v1/defense-periods/{periodId}/lecturer/committees/{{id}}/scores/*");

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var action = request.Action?.Trim().ToUpperInvariant();

            if (string.Equals(action, "SUBMIT", StringComparison.OrdinalIgnoreCase))
            {
                if (!request.Score.HasValue)
                {
                    var fail = ApiResponse<bool>.Fail("Score là bắt buộc cho action SUBMIT.", 400, code: DefenseUcErrorCodes.Scoring.InvalidScoreRequired);
                    return FromResult(fail);
                }

                var dto = new LecturerScoreSubmitDto
                {
                    AssignmentId = request.AssignmentId,
                    Score = request.Score.Value,
                    Comment = request.Comment
                };
                var submitResult = await _submitScoreCommand.ExecuteAsync(request.CommitteeId, dto, lecturerCode, CurrentUserId, idempotencyKey);
                return FromResult(submitResult);
            }

            if (string.Equals(action, "LOCK", StringComparison.OrdinalIgnoreCase))
            {
                var lockResult = await _lockSessionCommand.ExecuteAsync(request.CommitteeId, lecturerCode, CurrentUserId, idempotencyKey);
                return FromResult(lockResult);
            }

            if (string.Equals(action, "REOPEN", StringComparison.OrdinalIgnoreCase))
            {
                var dto = new ReopenScoreRequestDto
                {
                    AssignmentId = request.AssignmentId,
                    Reason = request.Reason ?? "Chair reopen"
                };
                var reopenResult = await _reopenScoreCommand.ExecuteAsync(request.CommitteeId, dto, lecturerCode, CurrentUserId, idempotencyKey);
                return FromResult(reopenResult);
            }

            var invalid = ApiResponse<bool>.Fail("Action phải là SUBMIT, LOCK hoặc REOPEN.", 400, code: DefenseUcErrorCodes.Scoring.InvalidAction);
            return FromResult(invalid);
        }

        [HttpPost("committees/{id:int}/scores/reopen-request")]
        public async Task<ActionResult<ApiResponse<bool>>> RequestReopenScore(int periodId, int id, [FromBody] ReopenScoreRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, ApiResponse<bool>.Fail(guard.Message ?? "Không thể truy vấn biên bản hội đồng.", guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard.Errors, guard.Code));
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _reopenScoreCommand.ExecuteAsync(id, request, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("scores/reopen")]
        public async Task<ActionResult<ApiResponse<bool>>> ReopenScore(int periodId, [FromBody] ChairScoreActionRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            MarkLegacyEndpoint(
                $"/api/v1/defense-periods/{periodId}/lecturer/scores/reopen",
                $"/api/v1/defense-periods/{periodId}/lecturer/committees/{{id}}/scores/reopen-request");

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var dto = new ReopenScoreRequestDto
            {
                AssignmentId = request.AssignmentId,
                Reason = request.Reason ?? "Chair reopen"
            };

            var result = await _reopenScoreCommand.ExecuteAsync(request.CommitteeId, dto, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("committees/{id:int}/lock-session")]
        public async Task<ActionResult<ApiResponse<bool>>> LockSession(int periodId, int id, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, ApiResponse<bool>.Fail(guard.Message ?? "Không thể truy vấn biên bản hội đồng.", guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard.Errors, guard.Code));
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _lockSessionCommand.ExecuteAsync(id, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("scores/lock")]
        public async Task<ActionResult<ApiResponse<bool>>> LockScores(int periodId, [FromBody] ChairScoreActionRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            MarkLegacyEndpoint(
                $"/api/v1/defense-periods/{periodId}/lecturer/scores/lock",
                $"/api/v1/defense-periods/{periodId}/lecturer/committees/{{id}}/lock-session");

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _lockSessionCommand.ExecuteAsync(request.CommitteeId, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpGet("revision-queue")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetRevisionQueue(int periodId)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _revisionQueueQuery.ExecuteAsync(lecturerCode, periodId);
            return FromResult(result);
        }

        [HttpGet("scoring/matrix")]
        public async Task<ActionResult<ApiResponse<List<ScoringMatrixRowDto>>>> GetScoringMatrix(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringMatrixQuery.ExecuteAsync(periodId, committeeId);
            return FromResult(result);
        }

        [HttpGet("scoring/progress")]
        public async Task<ActionResult<ApiResponse<List<ScoringProgressDto>>>> GetScoringProgress(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringProgressQuery.ExecuteAsync(periodId, committeeId);
            return FromResult(result);
        }

        [HttpGet("scoring/alerts")]
        public async Task<ActionResult<ApiResponse<List<ScoringAlertDto>>>> GetScoringAlerts(int periodId, [FromQuery] int? committeeId = null)
        {
            var result = await _scoringAlertsQuery.ExecuteAsync(periodId, committeeId);
            return FromResult(result);
        }

        [HttpPost("revisions/{revisionId:int}/approve")]
        public async Task<ActionResult<ApiResponse<bool>>> ApproveRevision(int periodId, int revisionId, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _approveRevisionCommand.ExecuteAsync(revisionId, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpPost("revisions/{revisionId:int}/reject")]
        public async Task<ActionResult<ApiResponse<bool>>> RejectRevision(int periodId, int revisionId, [FromBody] RejectRevisionRequestDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _rejectRevisionCommand.ExecuteAsync(revisionId, request, lecturerCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }
    }
}

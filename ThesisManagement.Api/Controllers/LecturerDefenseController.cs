using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IGetLecturerCommitteesQueryV2 _getCommitteesQuery;
        private readonly IGetLecturerMinutesQuery _getMinutesQuery;
        private readonly ISaveLecturerMinuteCommand _saveMinuteCommand;
        private readonly ISubmitLecturerIndependentScoreCommand _submitScoreCommand;
        private readonly IRequestReopenScoreCommand _reopenScoreCommand;
        private readonly ILockLecturerSessionCommand _lockSessionCommand;
        private readonly IGetLecturerRevisionQueueQuery _revisionQueueQuery;
        private readonly IApproveRevisionByLecturerCommand _approveRevisionCommand;
        private readonly IRejectRevisionByLecturerCommand _rejectRevisionCommand;

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
            IRejectRevisionByLecturerCommand rejectRevisionCommand) : base(uow, codeGen, mapper)
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
        }

        [HttpGet("committees")]
        public async Task<ActionResult<ApiResponse<object>>> GetCommittees(int periodId)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _getCommitteesQuery.ExecuteAsync(lecturerCode, periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("committees/{id:int}/minutes")]
        public async Task<ActionResult<ApiResponse<List<LecturerCommitteeMinuteDto>>>> GetMinutes(int periodId, int id)
        {
            var result = await _getMinutesQuery.ExecuteAsync(id, periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPut("committees/{id:int}/minutes")]
        public async Task<ActionResult<ApiResponse<bool>>> SaveMinutes(int periodId, int id, [FromBody] UpdateLecturerMinutesDto request)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard);
            }

            var result = await _saveMinuteCommand.ExecuteAsync(id, request, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("committees/{id:int}/scores/independent")]
        public async Task<ActionResult<ApiResponse<bool>>> SubmitIndependentScore(int periodId, int id, [FromBody] LecturerScoreSubmitDto request)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard);
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _submitScoreCommand.ExecuteAsync(id, request, lecturerCode, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("committees/{id:int}/scores/reopen-request")]
        public async Task<ActionResult<ApiResponse<bool>>> RequestReopenScore(int periodId, int id, [FromBody] ReopenScoreRequestDto request)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard);
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _reopenScoreCommand.ExecuteAsync(id, request, lecturerCode, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("committees/{id:int}/lock-session")]
        public async Task<ActionResult<ApiResponse<bool>>> LockSession(int periodId, int id)
        {
            var guard = await _getMinutesQuery.ExecuteAsync(id, periodId);
            if (!guard.Success)
            {
                return StatusCode(guard.HttpStatusCode == 0 ? 400 : guard.HttpStatusCode, guard);
            }

            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _lockSessionCommand.ExecuteAsync(id, lecturerCode, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpGet("revision-queue")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetRevisionQueue(int periodId)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _revisionQueueQuery.ExecuteAsync(lecturerCode, periodId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("revisions/{revisionId:int}/approve")]
        public async Task<ActionResult<ApiResponse<bool>>> ApproveRevision(int periodId, int revisionId)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _approveRevisionCommand.ExecuteAsync(revisionId, lecturerCode, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }

        [HttpPost("revisions/{revisionId:int}/reject")]
        public async Task<ActionResult<ApiResponse<bool>>> RejectRevision(int periodId, int revisionId, [FromBody] RejectRevisionRequestDto request)
        {
            var lecturerCode = GetRequestUserCode() ?? string.Empty;
            var result = await _rejectRevisionCommand.ExecuteAsync(revisionId, request, lecturerCode, CurrentUserId);
            return StatusCode(result.HttpStatusCode == 0 ? (result.Success ? 200 : 400) : result.HttpStatusCode, result);
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Command.DefenseExecution;
using ThesisManagement.Api.Application.Query.DefenseExecution;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.DefensePeriods;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/v1/defense-periods/{periodId:int}/student")]
    [Authorize(Roles = "Student")]
    public class StudentDefenseController : BaseApiController
    {
        private readonly IGetStudentDefenseInfoQueryV2 _getDefenseInfoQuery;
        private readonly IGetStudentNotificationsQuery _getNotificationsQuery;
        private readonly ISubmitStudentRevisionCommand _submitRevisionCommand;
        private readonly IGetStudentRevisionHistoryQuery _revisionHistoryQuery;

        public StudentDefenseController(
            Services.IUnitOfWork uow,
            Services.ICodeGenerator codeGen,
            AutoMapper.IMapper mapper,
            IGetStudentDefenseInfoQueryV2 getDefenseInfoQuery,
            IGetStudentNotificationsQuery getNotificationsQuery,
            ISubmitStudentRevisionCommand submitRevisionCommand,
            IGetStudentRevisionHistoryQuery revisionHistoryQuery) : base(uow, codeGen, mapper)
        {
            _getDefenseInfoQuery = getDefenseInfoQuery;
            _getNotificationsQuery = getNotificationsQuery;
            _submitRevisionCommand = submitRevisionCommand;
            _revisionHistoryQuery = revisionHistoryQuery;
        }

        [HttpGet("defense-info")]
        public async Task<ActionResult<ApiResponse<StudentDefenseInfoDtoV2>>> GetDefenseInfo(int periodId)
        {
            var studentCode = GetRequestUserCode() ?? string.Empty;
            var result = await _getDefenseInfoQuery.ExecuteAsync(studentCode, periodId);
            return FromResult(result);
        }

        [HttpGet("notifications")]
        public async Task<ActionResult<ApiResponse<List<StudentNotificationDto>>>> GetNotifications(int periodId)
        {
            var studentCode = GetRequestUserCode() ?? string.Empty;
            var result = await _getNotificationsQuery.ExecuteAsync(studentCode, periodId);
            return FromResult(result);
        }

        [HttpPost("revision-submissions")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponse<bool>>> SubmitRevision(int periodId, [FromForm] StudentRevisionSubmissionDto request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey = null)
        {
            var validPeriodAssignment = await IsAssignmentInPeriodAsync(periodId, request.AssignmentId);
            if (!validPeriodAssignment)
            {
                var fail = ApiResponse<bool>.Fail("Assignment không thuộc đợt bảo vệ.", 404, code: DefenseUcErrorCodes.Revision.AssignmentNotInPeriod);
                return FromResult(fail);
            }

            var studentCode = GetRequestUserCode() ?? string.Empty;
            var result = await _submitRevisionCommand.ExecuteAsync(request, studentCode, CurrentUserId, idempotencyKey);
            return FromResult(result);
        }

        [HttpGet("revision-submissions/history")]
        public async Task<ActionResult<ApiResponse<List<object>>>> GetRevisionHistory(int periodId)
        {
            var studentCode = GetRequestUserCode() ?? string.Empty;
            var result = await _revisionHistoryQuery.ExecuteAsync(studentCode, periodId);
            return FromResult(result);
        }

        private async Task<bool> IsAssignmentInPeriodAsync(int periodId, int assignmentId)
        {
            var period = await _uow.DefenseTerms.GetByIdAsync(periodId);
            if (period == null || string.IsNullOrWhiteSpace(period.ConfigJson))
            {
                return false;
            }

            var assignment = await _uow.DefenseAssignments.GetByIdAsync(assignmentId);
            if (assignment?.CommitteeID == null)
            {
                return false;
            }

            try
            {
                using var doc = JsonDocument.Parse(period.ConfigJson);
                if (!doc.RootElement.TryGetProperty("CouncilIds", out var councils) || councils.ValueKind != JsonValueKind.Array)
                {
                    return false;
                }

                foreach (var item in councils.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.Number && item.GetInt32() == assignment.CommitteeID.Value)
                    {
                        return true;
                    }
                }
            }
            catch
            {
                return false;
            }

            return false;
        }
    }
}

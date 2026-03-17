using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using ThesisManagement.Api.Application.Command.Reports;
using ThesisManagement.Api.Application.Query.Reports;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;
using ThesisManagement.Api.DTOs.Reports.Command;
using ThesisManagement.Api.DTOs.Reports.Query;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly IGetStudentDashboardQuery _getStudentDashboardQuery;
        private readonly IGetStudentProgressHistoryQuery _getStudentProgressHistoryQuery;
        private readonly IGetLecturerSubmissionListQuery _getLecturerSubmissionListQuery;
        private readonly ISubmitStudentProgressReportCommand _submitStudentProgressReportCommand;
        private readonly IReviewLecturerSubmissionCommand _reviewLecturerSubmissionCommand;

        public ReportsController(
            IGetStudentDashboardQuery getStudentDashboardQuery,
            IGetStudentProgressHistoryQuery getStudentProgressHistoryQuery,
            IGetLecturerSubmissionListQuery getLecturerSubmissionListQuery,
            ISubmitStudentProgressReportCommand submitStudentProgressReportCommand,
            IReviewLecturerSubmissionCommand reviewLecturerSubmissionCommand)
        {
            _getStudentDashboardQuery = getStudentDashboardQuery;
            _getStudentProgressHistoryQuery = getStudentProgressHistoryQuery;
            _getLecturerSubmissionListQuery = getLecturerSubmissionListQuery;
            _submitStudentProgressReportCommand = submitStudentProgressReportCommand;
            _reviewLecturerSubmissionCommand = reviewLecturerSubmissionCommand;
        }

        [HttpGet("student/dashboard")]
        public async Task<IActionResult> GetStudentDashboard([FromQuery] string userCode)
        {
            var result = await _getStudentDashboardQuery.ExecuteAsync(userCode);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<StudentDashboardDto>.SuccessResponse(result.Data));
        }

        [HttpGet("student/progress-history")]
        public async Task<IActionResult> GetStudentProgressHistory(
            [FromQuery] string userCode,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? state = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? milestoneCode = null)
        {
            var filter = new StudentProgressHistoryFilterDto(
                UserCode: userCode,
                Page: page,
                PageSize: pageSize,
                State: state,
                FromDate: fromDate,
                ToDate: toDate,
                MilestoneCode: milestoneCode);

            var result = await _getStudentProgressHistoryQuery.ExecuteAsync(filter);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<StudentProgressHistoryDto>.SuccessResponse(result.Data, result.Data?.TotalCount ?? 0));
        }

        [HttpPost("student/progress-submit")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitStudentProgress()
        {
            if (!Request.HasFormContentType)
                return BadRequest(ApiResponse<object>.Fail("Content-Type must be multipart/form-data", 400));

            var form = await Request.ReadFormAsync();

            string Get(string key)
            {
                if (form.TryGetValue(key, out StringValues value) && !StringValues.IsNullOrEmpty(value))
                    return value.ToString();
                return string.Empty;
            }

            var payload = new StudentProgressSubmitFormDto(
                TopicCode: Get("topicCode"),
                MilestoneCode: Get("milestoneCode"),
                StudentUserCode: Get("studentUserCode"),
                StudentProfileCode: string.IsNullOrWhiteSpace(Get("studentProfileCode")) ? null : Get("studentProfileCode"),
                LecturerCode: string.IsNullOrWhiteSpace(Get("lecturerCode")) ? null : Get("lecturerCode"),
                ReportTitle: string.IsNullOrWhiteSpace(Get("reportTitle")) ? null : Get("reportTitle"),
                ReportDescription: string.IsNullOrWhiteSpace(Get("reportDescription")) ? null : Get("reportDescription"),
                AttemptNumber: int.TryParse(Get("attemptNumber"), out var attemptNumber) ? attemptNumber : null);

            var result = await _submitStudentProgressReportCommand.ExecuteAsync(payload, form.Files);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<StudentProgressSubmitResultDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }

        [HttpGet("lecturer/submissions")]
        public async Task<IActionResult> GetLecturerSubmissions(
            [FromQuery] string lecturerCode,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? state = null)
        {
            var filter = new LecturerSubmissionFilterDto(
                LecturerCode: lecturerCode,
                Page: page,
                PageSize: pageSize,
                State: state);

            var result = await _getLecturerSubmissionListQuery.ExecuteAsync(filter);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<LecturerSubmissionListDto>.SuccessResponse(result.Data, result.Data?.TotalCount ?? 0));
        }

        [HttpPut("lecturer/submissions/{submissionId:int}/review")]
        public async Task<IActionResult> ReviewSubmission(int submissionId, [FromBody] ProgressSubmissionUpdateDto dto)
        {
            var result = await _reviewLecturerSubmissionCommand.ExecuteAsync(submissionId, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<object>.SuccessResponse(result.Data));
        }
    }
}

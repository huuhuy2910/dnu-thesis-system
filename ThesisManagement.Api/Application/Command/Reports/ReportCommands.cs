using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;
using ThesisManagement.Api.DTOs.Reports.Command;
using ThesisManagement.Api.DTOs.Reports.Query;

namespace ThesisManagement.Api.Application.Command.Reports
{
    public interface ISubmitStudentProgressReportCommand
    {
        Task<OperationResult<StudentProgressSubmitResultDto>> ExecuteAsync(StudentProgressSubmitFormDto form, IReadOnlyList<IFormFile> files);
    }

    public interface IReviewLecturerSubmissionCommand
    {
        Task<OperationResult<object>> ExecuteAsync(int submissionId, ProgressSubmissionUpdateDto dto);
    }

    public class SubmitStudentProgressReportCommand : ISubmitStudentProgressReportCommand
    {
        private readonly IReportCommandProcessor _processor;

        public SubmitStudentProgressReportCommand(IReportCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<StudentProgressSubmitResultDto>> ExecuteAsync(StudentProgressSubmitFormDto form, IReadOnlyList<IFormFile> files)
            => _processor.SubmitStudentProgressAsync(form, files);
    }

    public class ReviewLecturerSubmissionCommand : IReviewLecturerSubmissionCommand
    {
        private readonly IReportCommandProcessor _processor;

        public ReviewLecturerSubmissionCommand(IReportCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<object>> ExecuteAsync(int submissionId, ProgressSubmissionUpdateDto dto)
            => _processor.ReviewLecturerSubmissionAsync(submissionId, dto);
    }
}

using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Reports.Query;

namespace ThesisManagement.Api.Application.Query.Reports
{
    public interface IGetStudentDashboardQuery
    {
        Task<OperationResult<StudentDashboardDto>> ExecuteAsync(string userCode);
    }

    public interface IGetStudentProgressHistoryQuery
    {
        Task<OperationResult<StudentProgressHistoryDto>> ExecuteAsync(StudentProgressHistoryFilterDto filter);
    }

    public interface IGetLecturerSubmissionListQuery
    {
        Task<OperationResult<LecturerSubmissionListDto>> ExecuteAsync(LecturerSubmissionFilterDto filter);
    }

    public class GetStudentDashboardQuery : IGetStudentDashboardQuery
    {
        private readonly IReportQueryProcessor _processor;

        public GetStudentDashboardQuery(IReportQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<StudentDashboardDto>> ExecuteAsync(string userCode)
            => _processor.GetStudentDashboardAsync(userCode);
    }

    public class GetStudentProgressHistoryQuery : IGetStudentProgressHistoryQuery
    {
        private readonly IReportQueryProcessor _processor;

        public GetStudentProgressHistoryQuery(IReportQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<StudentProgressHistoryDto>> ExecuteAsync(StudentProgressHistoryFilterDto filter)
            => _processor.GetStudentProgressHistoryAsync(filter);
    }

    public class GetLecturerSubmissionListQuery : IGetLecturerSubmissionListQuery
    {
        private readonly IReportQueryProcessor _processor;

        public GetLecturerSubmissionListQuery(IReportQueryProcessor processor)
        {
            _processor = processor;
        }

        public Task<OperationResult<LecturerSubmissionListDto>> ExecuteAsync(LecturerSubmissionFilterDto filter)
            => _processor.GetLecturerSubmissionListAsync(filter);
    }
}

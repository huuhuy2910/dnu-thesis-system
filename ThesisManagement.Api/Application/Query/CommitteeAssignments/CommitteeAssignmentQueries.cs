using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Tags.Query;
using ThesisManagement.Api.Application.Command.CommitteeAssignments;

namespace ThesisManagement.Api.Application.Query.CommitteeAssignments
{
    public interface IGetCommitteesQuery
    {
        Task<ApiResponse<PagedResult<CommitteeSummaryDto>>> ExecuteAsync(int page, int pageSize, string? keyword, DateTime? date, string[]? tags, CancellationToken cancellationToken = default);
    }

    public interface IGetCommitteeDetailQuery
    {
        Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string committeeCode, CancellationToken cancellationToken = default);
    }

    public interface IGetCommitteeCreateInitQuery
    {
        Task<ApiResponse<CommitteeCreateInitDto>> ExecuteAsync(CancellationToken cancellationToken = default);
    }

    public interface IGetAvailableLecturersQuery
    {
        Task<ApiResponse<List<AvailableLecturerDto>>> ExecuteAsync(string? tag, DateTime? date, string? role, bool? requireChair, string? committeeCode, CancellationToken cancellationToken = default);
    }

    public interface IGetAvailableTopicsQuery
    {
        Task<ApiResponse<List<AvailableTopicDto>>> ExecuteAsync(string? tag, string? department, string? committeeCode, CancellationToken cancellationToken = default);
    }

    public interface IGetCommitteeTagsQuery
    {
        Task<ApiResponse<List<TagReadDto>>> ExecuteAsync(CancellationToken cancellationToken = default);
    }

    public interface IGetLecturerCommitteesQuery
    {
        Task<ApiResponse<LecturerCommitteesDto>> ExecuteAsync(string lecturerCode, CancellationToken cancellationToken = default);
    }

    public interface IGetStudentDefenseInfoQuery
    {
        Task<ApiResponse<StudentDefenseInfoDto>> ExecuteAsync(string studentCode, CancellationToken cancellationToken = default);
    }

    public class GetCommitteesQuery : IGetCommitteesQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetCommitteesQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<PagedResult<CommitteeSummaryDto>>> ExecuteAsync(int page, int pageSize, string? keyword, DateTime? date, string[]? tags, CancellationToken cancellationToken = default)
            => _processor.GetCommitteesAsync(page, pageSize, keyword, date, tags, cancellationToken);
    }

    public class GetCommitteeDetailQuery : IGetCommitteeDetailQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetCommitteeDetailQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeDetailDto>> ExecuteAsync(string committeeCode, CancellationToken cancellationToken = default)
            => _processor.GetCommitteeDetailAsync(committeeCode, cancellationToken);
    }

    public class GetCommitteeCreateInitQuery : IGetCommitteeCreateInitQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetCommitteeCreateInitQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<CommitteeCreateInitDto>> ExecuteAsync(CancellationToken cancellationToken = default)
            => _processor.GetCommitteeCreateInitAsync(cancellationToken);
    }

    public class GetAvailableLecturersQuery : IGetAvailableLecturersQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetAvailableLecturersQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<List<AvailableLecturerDto>>> ExecuteAsync(string? tag, DateTime? date, string? role, bool? requireChair, string? committeeCode, CancellationToken cancellationToken = default)
            => _processor.GetAvailableLecturersAsync(tag, date, role, requireChair, committeeCode, cancellationToken);
    }

    public class GetAvailableTopicsQuery : IGetAvailableTopicsQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetAvailableTopicsQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<List<AvailableTopicDto>>> ExecuteAsync(string? tag, string? department, string? committeeCode, CancellationToken cancellationToken = default)
            => _processor.GetAvailableTopicsAsync(tag, department, committeeCode, cancellationToken);
    }

    public class GetCommitteeTagsQuery : IGetCommitteeTagsQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetCommitteeTagsQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<List<TagReadDto>>> ExecuteAsync(CancellationToken cancellationToken = default)
            => _processor.GetTagsAsync(cancellationToken);
    }

    public class GetLecturerCommitteesQuery : IGetLecturerCommitteesQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetLecturerCommitteesQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<LecturerCommitteesDto>> ExecuteAsync(string lecturerCode, CancellationToken cancellationToken = default)
            => _processor.GetLecturerCommitteesAsync(lecturerCode, cancellationToken);
    }

    public class GetStudentDefenseInfoQuery : IGetStudentDefenseInfoQuery
    {
        private readonly ICommitteeAssignmentCommandProcessor _processor;

        public GetStudentDefenseInfoQuery(ICommitteeAssignmentCommandProcessor processor)
        {
            _processor = processor;
        }

        public Task<ApiResponse<StudentDefenseInfoDto>> ExecuteAsync(string studentCode, CancellationToken cancellationToken = default)
            => _processor.GetStudentDefenseInfoAsync(studentCode, cancellationToken);
    }
}

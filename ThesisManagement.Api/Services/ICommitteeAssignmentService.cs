using System.Collections.Generic;
using System.Threading;
using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.Services
{
    public interface ICommitteeAssignmentService
    {
        // Init / CRUD
        Task<ApiResponse<CommitteeCreateInitDto>> GetCommitteeCreateInitAsync(CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> CreateCommitteeAsync(CommitteeCreateRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> UpdateCommitteeAsync(string committeeCode, CommitteeUpdateRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> UpdateCommitteeMembersAsync(CommitteeMembersUpdateRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CommitteeDetailDto>> SaveCommitteeMembersAsync(CommitteeMembersCreateRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> DeleteCommitteeAsync(string committeeCode, bool force, CancellationToken cancellationToken = default);

        // Queries
        Task<ApiResponse<PagedResult<CommitteeSummaryDto>>> GetCommitteesAsync(int page, int pageSize, string? keyword, DateTime? date, string[]? tags, CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> GetCommitteeDetailAsync(string committeeCode, CancellationToken cancellationToken = default);

        // Availability
    Task<ApiResponse<List<AvailableLecturerDto>>> GetAvailableLecturersAsync(string? tag, DateTime? date, string? role, bool? requireChair, string? committeeCode, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AvailableTopicDto>>> GetAvailableTopicsAsync(string? tag, string? department, string? committeeCode, CancellationToken cancellationToken = default);
        
        // Tags
        Task<ApiResponse<List<TagReadDto>>> GetTagsAsync(CancellationToken cancellationToken = default);

        // Assignments
        Task<ApiResponse<CommitteeDetailDto>> AssignTopicsAsync(AssignTopicRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<object>> AutoAssignTopicsAsync(AutoAssignRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> ChangeAssignmentAsync(ChangeAssignmentRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CommitteeDetailDto>> RemoveAssignmentAsync(string topicCode, CancellationToken cancellationToken = default);

        // Views
        Task<ApiResponse<LecturerCommitteesDto>> GetLecturerCommitteesAsync(string lecturerCode, CancellationToken cancellationToken = default);
        Task<ApiResponse<StudentDefenseInfoDto>> GetStudentDefenseInfoAsync(string studentCode, CancellationToken cancellationToken = default);
    }
}

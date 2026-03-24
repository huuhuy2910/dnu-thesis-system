using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.DTOs.Reports.Query
{
    public record ReportTagDto(
        string TagCode,
        string TagName);

    public record ReportTopicDto(
        int TopicID,
        string TopicCode,
        string Title,
        string? Summary,
        string Type,
        string Status,
        string? CatalogTopicCode,
        string? SupervisorLecturerCode,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record ReportMilestoneDto(
        int MilestoneID,
        string MilestoneCode,
        string? TopicCode,
        string? MilestoneTemplateCode,
        int? Ordinal,
        DateTime? Deadline,
        string? State,
        DateTime? StartedAt,
        DateTime? CompletedAt1,
        DateTime? CompletedAt2,
        DateTime? CompletedAt3,
        DateTime? CompletedAt4,
        DateTime? CompletedAt5);

    public record ReportSupervisorDto(
        int LecturerProfileID,
        string LecturerCode,
        string? FullName,
        string? Degree,
        string? Email,
        string? PhoneNumber,
        string? DepartmentCode,
        int? GuideQuota,
        int? CurrentGuidingCount);

    public record ReportSubmissionFileDto(
        int FileID,
        string? SubmissionCode,
        string FileURL,
        string? FileName,
        long? FileSizeBytes,
        string? MimeType,
        DateTime? UploadedAt,
        string? UploadedByUserCode);

    public record ReportSubmissionDto(
        int SubmissionID,
        string SubmissionCode,
        int? MilestoneID,
        string? MilestoneCode,
        string? StudentUserCode,
        string? StudentProfileCode,
        string? LecturerCode,
        DateTime? SubmittedAt,
        int? AttemptNumber,
        string? LecturerComment,
        string? LecturerState,
        string? FeedbackLevel,
        string? ReportTitle,
        string? ReportDescription,
        DateTime? LastUpdated,
        IReadOnlyList<ReportSubmissionFileDto> Files);

    public record StudentDashboardDto(
        ReportTopicDto? Topic,
        IReadOnlyList<ReportTagDto> TopicTags,
        ReportMilestoneDto? CurrentMilestone,
        ReportSupervisorDto? Supervisor,
        IReadOnlyList<ReportTagDto> SupervisorTags,
        bool CanSubmit,
        string? BlockReason);

    public record StudentProgressHistoryItemDto(
        ReportSubmissionDto Submission);

    public record StudentProgressHistoryDto(
        IReadOnlyList<StudentProgressHistoryItemDto> Items,
        int Page,
        int PageSize,
        int TotalCount);

    public record StudentProgressSubmitResultDto(
        ReportSubmissionDto Submission,
        string Message);

    public record LecturerSubmissionRowDto(
        ReportSubmissionDto Submission,
        ReportStudentDto? Student,
        ReportTopicDto? Topic,
        ReportSupervisorDto? Supervisor);

    public record LecturerSubmissionListDto(
        IReadOnlyList<LecturerSubmissionRowDto> Items,
        int Page,
        int PageSize,
        int TotalCount);

    public record ReportStudentDto(
        int StudentProfileID,
        string StudentCode,
        string? UserCode,
        string? FullName,
        string? StudentEmail,
        string? PhoneNumber,
        string? DepartmentCode,
        string? ClassCode);

    public record StudentProgressHistoryFilterDto(
        string UserCode,
        int Page = 1,
        int PageSize = 10,
        string? State = null,
        DateTime? FromDate = null,
        DateTime? ToDate = null,
        string? MilestoneCode = null);

    public record LecturerSubmissionFilterDto(
        string LecturerCode,
        int Page = 1,
        int PageSize = 20,
        string? State = null);
}

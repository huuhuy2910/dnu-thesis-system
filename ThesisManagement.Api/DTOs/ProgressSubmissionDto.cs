using System;

namespace ThesisManagement.Api.DTOs
{
    public record ProgressSubmissionCreateDto(
        int? MilestoneID,
        string MilestoneCode,
        int? StudentUserID,
        string StudentUserCode,
    int? StudentProfileID,
    string? StudentProfileCode,
    int? AttemptNumber,
    string? ReportTitle,
    string? ReportDescription);

    public record ProgressSubmissionUpdateDto(
    string? LecturerComment,
    string? LecturerState,
    string? FeedbackLevel,
    int? AttemptNumber,
    string? ReportTitle,
    string? ReportDescription);

    public record ProgressSubmissionReadDto(
        int SubmissionID,
        string SubmissionCode,
        int? MilestoneID,
        string? MilestoneCode,
        int? StudentUserID,
        string? StudentUserCode,
        int? StudentProfileID,
        string? StudentProfileCode,
        DateTime? SubmittedAt,
    int? AttemptNumber,
        string? LecturerComment,
        string? LecturerState,
        string? FeedbackLevel,
        string? ReportTitle,
        string? ReportDescription,
        DateTime? LastUpdated);
}

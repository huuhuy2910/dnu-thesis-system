namespace ThesisManagement.Api.DTOs.ProgressSubmissions.Command
{
    public record ProgressSubmissionCreateDto(
        int? MilestoneID,
        string MilestoneCode,
        int? StudentUserID,
        string StudentUserCode,
        int? StudentProfileID,
        string? StudentProfileCode,
        int? LecturerProfileID,
        string? LecturerCode,
        int? AttemptNumber,
        string? ReportTitle,
        string? ReportDescription);

    public record ProgressSubmissionUpdateDto(
        string? LecturerComment,
        string? LecturerState,
        string? FeedbackLevel);
}
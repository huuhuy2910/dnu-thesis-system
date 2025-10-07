using System;

namespace ThesisManagement.Api.DTOs
{
    public record ProgressSubmissionCreateDto(string MilestoneCode, string StudentUserCode, string? StudentProfileCode, string? FileURL);
    public record ProgressSubmissionUpdateDto(string? FileURL, string? LecturerComment, string? LecturerState, string? FeedbackLevel);
    public record ProgressSubmissionReadDto(int SubmissionID, string SubmissionCode, string? MilestoneCode, string? StudentUserCode, string? StudentProfileCode, string? FileURL, DateTime? SubmittedAt, string? LecturerComment, string? LecturerState, string? FeedbackLevel, DateTime LastUpdated);
}

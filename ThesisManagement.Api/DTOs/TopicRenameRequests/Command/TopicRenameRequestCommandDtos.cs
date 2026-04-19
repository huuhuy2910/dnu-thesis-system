using System;

namespace ThesisManagement.Api.DTOs.TopicRenameRequests.Command
{
    public record TopicRenameRequestCreateDto(
        int? TopicID,
        string? TopicCode,
        string NewTitle,
        string? Reason,
        string? ReviewedByUserCode = null,
        string? ReviewedByRole = null);

    public record TopicRenameRequestUpdateDto(
        string? NewTitle,
        string? Reason);

    public record TopicRenameRequestReviewDto(
        string Action,
        string? Comment);
}
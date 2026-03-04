using System;

namespace ThesisManagement.Api.DTOs.SubmissionFiles.Command
{
    public record SubmissionFileCreateDto(
        int SubmissionID,
        string? SubmissionCode,
        string FileURL,
        string? FileName,
        long? FileSizeBytes,
        string? MimeType,
        DateTime? UploadedAt,
        string? UploadedByUserCode,
        int? UploadedByUserID);

    public record SubmissionFileUpdateDto(
        string? FileURL,
        string? FileName,
        long? FileSizeBytes,
        string? MimeType,
        DateTime? UploadedAt,
        string? UploadedByUserCode,
        int? UploadedByUserID);
}
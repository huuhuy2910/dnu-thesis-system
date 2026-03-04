using System;

namespace ThesisManagement.Api.DTOs.SubmissionFiles.Query
{
    public record SubmissionFileReadDto(
        int FileID,
        int SubmissionID,
        string? SubmissionCode,
        string FileURL,
        string? FileName,
        long? FileSizeBytes,
        string? MimeType,
        DateTime? UploadedAt,
        string? UploadedByUserCode,
        int? UploadedByUserID);
}
using System;

namespace ThesisManagement.Api.DTOs.MessageAttachments.Query
{
    public record MessageAttachmentReadDto(
        int AttachmentID,
        int MessageID,
        string FileUrl,
        string? FileName,
        string? MimeType,
        long? FileSizeBytes,
        string? ThumbnailURL,
        DateTime? UploadedAt
    );
}

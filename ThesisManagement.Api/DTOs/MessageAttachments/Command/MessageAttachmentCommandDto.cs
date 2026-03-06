namespace ThesisManagement.Api.DTOs.MessageAttachments.Command
{
    public record MessageAttachmentCreateDto(
        int MessageID,
        string FileUrl,
        string? FileName,
        string? MimeType,
        long? FileSizeBytes,
        string? ThumbnailURL
    );

    public record MessageAttachmentUpdateDto(
        string? FileUrl,
        string? FileName,
        string? MimeType,
        long? FileSizeBytes,
        string? ThumbnailURL
    );
}

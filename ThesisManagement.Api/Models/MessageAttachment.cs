using System;

namespace ThesisManagement.Api.Models
{
    public class MessageAttachment
    {
        public int AttachmentID { get; set; }
        public int MessageID { get; set; }
        public string FileUrl { get; set; } = null!;
        public string? FileName { get; set; }
        public string? MimeType { get; set; }
        public long? FileSizeBytes { get; set; }
        public string? ThumbnailURL { get; set; }
        public DateTime? UploadedAt { get; set; }

        public Message? Message { get; set; }
    }
}

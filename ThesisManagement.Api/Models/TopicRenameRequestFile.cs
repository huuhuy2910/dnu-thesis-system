using System;

namespace ThesisManagement.Api.Models
{
    public class TopicRenameRequestFile
    {
        public int FileId { get; set; }
        public string FileCode { get; set; } = null!;
        public int RequestId { get; set; }
        public string FileType { get; set; } = null!;
        public string FileName { get; set; } = null!;
        public string? OriginalFileName { get; set; }
        public string FileUrl { get; set; } = null!;
        public string? FilePath { get; set; }
        public string StorageProvider { get; set; } = null!;
        public string? MimeType { get; set; }
        public long? FileSize { get; set; }
        public string? FileHash { get; set; }
        public int FileVersion { get; set; } = 1;
        public bool IsCurrent { get; set; } = true;
        public int? UploadedByUserId { get; set; }
        public string? UploadedByUserCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public TopicRenameRequest? Request { get; set; }
        public User? UploadedByUser { get; set; }
    }
}
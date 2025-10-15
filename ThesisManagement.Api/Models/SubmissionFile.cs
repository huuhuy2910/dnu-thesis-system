using System;

namespace ThesisManagement.Api.Models
{
    public class SubmissionFile
    {
        public int FileID { get; set; }
        public int SubmissionID { get; set; }
        public string? SubmissionCode { get; set; }
        public string FileURL { get; set; } = null!;
        public string? FileName { get; set; }
        public long? FileSizeBytes { get; set; }
        public string? MimeType { get; set; }
        public DateTime? UploadedAt { get; set; }
        public string? UploadedByUserCode { get; set; }
        public int? UploadedByUserID { get; set; }

        public ProgressSubmission? Submission { get; set; }
    }
}

using System;

namespace ThesisManagement.Api.DTOs
{
    public class SubmissionFileFilter : BaseFilter
    {
        public int? SubmissionID { get; set; }
        public string? SubmissionCode { get; set; }
        public string? FileName { get; set; }
        public string? MimeType { get; set; }
        public string? UploadedByUserCode { get; set; }
        public int? UploadedByUserID { get; set; }
        public DateTime? UploadedFrom { get; set; }
        public DateTime? UploadedTo { get; set; }
    }
}

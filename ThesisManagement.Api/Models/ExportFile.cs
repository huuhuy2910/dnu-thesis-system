namespace ThesisManagement.Api.Models
{
    public class ExportFile
    {
        public int ExportFileId { get; set; }
        public string FileCode { get; set; } = string.Empty;
        public int TermId { get; set; }
        public string Status { get; set; } = "Running";
        public string? FileUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

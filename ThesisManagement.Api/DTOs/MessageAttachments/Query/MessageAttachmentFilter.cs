namespace ThesisManagement.Api.DTOs.MessageAttachments.Query
{
    public class MessageAttachmentFilter : BaseFilter
    {
        public int? MessageID { get; set; }
        public string? MimeType { get; set; }
    }
}

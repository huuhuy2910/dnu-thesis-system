namespace ThesisManagement.Api.DTOs.Messages.Query
{
    public class MessageFilter : BaseFilter
    {
        public int? ConversationID { get; set; }
        public string? SenderUserCode { get; set; }
        public string? MessageType { get; set; }
        public bool? IsDeleted { get; set; }
    }
}

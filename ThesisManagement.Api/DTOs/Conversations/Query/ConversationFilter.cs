namespace ThesisManagement.Api.DTOs.Conversations.Query
{
    public class ConversationFilter : BaseFilter
    {
        public int? ConversationID { get; set; }
        public string? ConversationCode { get; set; }
        public string? ConversationType { get; set; }
        public string? CreatedByUserCode { get; set; }
        public bool? IsArchived { get; set; }
    }
}

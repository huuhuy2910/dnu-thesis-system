namespace ThesisManagement.Api.DTOs.MessageReactions.Query
{
    public class MessageReactionFilter : BaseFilter
    {
        public int? MessageID { get; set; }
        public string? UserCode { get; set; }
        public string? ReactionType { get; set; }
    }
}

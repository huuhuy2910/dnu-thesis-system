namespace ThesisManagement.Api.DTOs.ConversationMembers.Query
{
    public class ConversationMemberFilter : BaseFilter
    {
        public int? ConversationID { get; set; }
        public string? UserCode { get; set; }
        public string? MemberRole { get; set; }
        public bool? IsActive { get; set; }
    }
}

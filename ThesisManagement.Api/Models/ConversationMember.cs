using System;

namespace ThesisManagement.Api.Models
{
    public class ConversationMember
    {
        public int MemberID { get; set; }
        public int ConversationID { get; set; }
        public string? ConversationCode { get; set; }
        public int UserID { get; set; }
        public string UserCode { get; set; } = null!;
        public string MemberRole { get; set; } = "Member";
        public string? NickName { get; set; }
        public bool IsMuted { get; set; } = false;
        public bool IsPinned { get; set; } = false;
        public int? LastReadMessageID { get; set; }
        public DateTime? LastReadAt { get; set; }
        public int UnreadCount { get; set; } = 0;
        public DateTime? JoinedAt { get; set; }
        public DateTime? LeftAt { get; set; }

        public Conversation? Conversation { get; set; }
        public User? User { get; set; }
    }
}

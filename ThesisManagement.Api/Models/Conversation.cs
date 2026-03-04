using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Conversation
    {
        public int ConversationID { get; set; }
        public string ConversationCode { get; set; } = null!;
        public string ConversationType { get; set; } = null!;
        public string? Title { get; set; }
        public int CreatedByUserID { get; set; }
        public string? CreatedByUserCode { get; set; }
        public string? AvatarURL { get; set; }
        public int? LastMessageID { get; set; }
        public string? LastMessagePreview { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public bool IsArchived { get; set; } = false;
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastUpdated { get; set; }

        public ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}

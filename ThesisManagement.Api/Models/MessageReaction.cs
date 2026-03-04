using System;

namespace ThesisManagement.Api.Models
{
    public class MessageReaction
    {
        public int ReactionID { get; set; }
        public int MessageID { get; set; }
        public int UserID { get; set; }
        public string UserCode { get; set; } = null!;
        public string ReactionType { get; set; } = null!;
        public DateTime? ReactedAt { get; set; }

        public Message? Message { get; set; }
        public User? User { get; set; }
    }
}

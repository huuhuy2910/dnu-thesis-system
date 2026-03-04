using System;
using System.Collections.Generic;

namespace ThesisManagement.Api.Models
{
    public class Message
    {
        public int MessageID { get; set; }
        public string MessageCode { get; set; } = null!;
        public int ConversationID { get; set; }
        public string? ConversationCode { get; set; }
        public int SenderUserID { get; set; }
        public string SenderUserCode { get; set; } = null!;
        public string? Content { get; set; }
        public string MessageType { get; set; } = "TEXT";
        public int? ReplyToMessageID { get; set; }
        public bool IsEdited { get; set; } = false;
        public bool IsDeleted { get; set; } = false;
        public bool DeletedForEveryone { get; set; } = false;
        public DateTime? SentAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public DateTime? CreatedAt { get; set; }

        public Conversation? Conversation { get; set; }
        public User? SenderUser { get; set; }
        public Message? ReplyToMessage { get; set; }

        public ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
        public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    }
}

using System;

namespace ThesisManagement.Api.Models
{
    public class MessageReadReceipt
    {
        public int ReceiptID { get; set; }
        public int MessageID { get; set; }
        public int UserID { get; set; }
        public string UserCode { get; set; } = null!;
        public DateTime? ReadAt { get; set; }

        public User? User { get; set; }
        public Message? Message { get; set; }
    }
}

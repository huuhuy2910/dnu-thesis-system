using System;

namespace ThesisManagement.Api.Models
{
    public class Room
    {
        public int RoomID { get; set; }
        public string RoomCode { get; set; } = null!;
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}

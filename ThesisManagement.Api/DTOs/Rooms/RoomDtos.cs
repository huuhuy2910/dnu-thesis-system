using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs.Rooms
{
    public class RoomReadDto
    {
        public int RoomID { get; set; }
        public string RoomCode { get; set; } = string.Empty;
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class RoomCreateDto
    {
        [Required]
        [MaxLength(40)]
        public string RoomCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Status { get; set; }
    }

    public class RoomUpdateDto
    {
        [Required]
        [MaxLength(40)]
        public string RoomCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Status { get; set; }
    }
}

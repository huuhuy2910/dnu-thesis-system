namespace ThesisManagement.Api.Models
{
    public class LecturerBusyTime
    {
        public int LecturerBusyTimeId { get; set; }
        public int LecturerProfileId { get; set; }
        public string Slot { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public LecturerProfile? LecturerProfile { get; set; }
    }
}

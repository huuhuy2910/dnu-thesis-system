using System;

namespace ThesisManagement.Api.Models
{
    public class NotificationPreference
    {
        public int PreferenceID { get; set; }
        public int TargetUserID { get; set; }
        public string TargetUserCode { get; set; } = null!;
        public string NotifCategory { get; set; } = null!;
        public int InAppEnabled { get; set; } = 1;
        public int EmailEnabled { get; set; } = 0;
        public int PushEnabled { get; set; } = 0;
        public string DigestMode { get; set; } = "IMMEDIATE";
        public string? QuietFrom { get; set; }
        public string? QuietTo { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public User? TargetUser { get; set; }
    }
}

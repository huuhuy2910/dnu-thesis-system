using System;

namespace ThesisManagement.Api.Models
{
    public class CommitteeSession
    {
        public int CommitteeSessionID { get; set; }
        public int CommitteeID { get; set; }
        public string CommitteeCode { get; set; } = string.Empty;
        public int SessionNumber { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int TopicCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }

        public Committee? Committee { get; set; }
    }
}

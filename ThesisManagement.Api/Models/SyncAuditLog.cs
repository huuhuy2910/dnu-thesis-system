namespace ThesisManagement.Api.Models
{
    public class SyncAuditLog
    {
        public int SyncAuditLogId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string Records { get; set; } = string.Empty;
    }
}

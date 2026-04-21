namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class DefensePeriodConfigDto
    {
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<string> Rooms { get; set; } = new();
        public string MorningStart { get; set; } = "07:30";
        public string AfternoonStart { get; set; } = "13:30";
        public int SoftMaxCapacity { get; set; } = 4;
        public int TopicsPerSessionConfig { get; set; } = 3;
        public int MembersPerCouncilConfig { get; set; } = 3;
        public List<string> Tags { get; set; } = new();
    }

    public class DefensePeriodStateDto
    {
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool LecturerCapabilitiesLocked { get; set; }
        public bool CouncilConfigConfirmed { get; set; }
        public bool CouncilListLocked { get; set; }
        public bool Finalized { get; set; }
        public bool ScoresPublished { get; set; }
        public int CouncilCount { get; set; }
        public List<string> AllowedActions { get; set; } = new();
        public Dictionary<string, bool> Readiness { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class CouncilAuditHistoryDto
    {
        public int SyncAuditLogId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string Records { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class SyncErrorDetailDto
    {
        public int RowNo { get; set; }
        public string TopicCode { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string? SupervisorCode { get; set; }
        public string Field { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class ExportHistoryDto
    {
        public int ExportFileId { get; set; }
        public string FileCode { get; set; } = string.Empty;
        public int TermId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? FileUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PublishHistoryDto
    {
        public int SyncAuditLogId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string Records { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class RevisionAuditTrailDto
    {
        public int SyncAuditLogId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string Records { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}

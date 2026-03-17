namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public static class DefenseSessionCodes
    {
        public const string Morning = "MORNING";
        public const string Afternoon = "AFTERNOON";
    }

    public class EligibleStudentDto
    {
        public string StudentCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string TopicTitle { get; set; } = string.Empty;
        public string? SupervisorCode { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool IsEligible { get; set; }
        public bool Valid { get; set; }
        public string? Error { get; set; }
    }

    public class LecturerCapabilityDto
    {
        public string LecturerCode { get; set; } = string.Empty;
        public string LecturerName { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public List<string> BusySlots { get; set; } = new();
        public string? Warning { get; set; }
    }

    public class LecturerBusySlotsDto
    {
        public string LecturerCode { get; set; } = string.Empty;
        public List<string> BusySlots { get; set; } = new();
    }

    public class CouncilMemberDto
    {
        public string Role { get; set; } = string.Empty;
        public string LecturerCode { get; set; } = string.Empty;
        public string LecturerName { get; set; } = string.Empty;
    }

    public class CouncilDraftDto
    {
        public int Id { get; set; }
        public string ConcurrencyToken { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;
        public string SlotId { get; set; } = string.Empty;
        public List<string> CouncilTags { get; set; } = new();
        public List<EligibleStudentDto> MorningStudents { get; set; } = new();
        public List<EligibleStudentDto> AfternoonStudents { get; set; } = new();
        public List<string> ForbiddenLecturers { get; set; } = new();
        public List<CouncilMemberDto> Members { get; set; } = new();
        public string? Warning { get; set; }
        public string Status { get; set; } = "Draft";
    }

    public class CouncilFilterDto
    {
        public string? Keyword { get; set; }
        public string? Tag { get; set; }
        public string? Room { get; set; }
        public int Page { get; set; } = 1;
        public int Size { get; set; } = 20;
    }

    public class LecturerCommitteeMinuteDto
    {
        public int AssignmentId { get; set; }
        public string TopicCode { get; set; } = string.Empty;
        public string TopicTitle { get; set; } = string.Empty;
        public string? SummaryContent { get; set; }
        public string? QnaDetails { get; set; }
        public DateTime? LastUpdated { get; set; }
    }

    public class StudentDefenseInfoDtoV2
    {
        public string StudentCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string TopicTitle { get; set; } = string.Empty;
        public string? CommitteeCode { get; set; }
        public string? Room { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int? Session { get; set; }
        public string? SessionCode { get; set; }
        public decimal? FinalScore { get; set; }
        public string? Grade { get; set; }
    }

    public class StudentNotificationDto
    {
        public string Type { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}

namespace ThesisManagement.Api.DTOs.Reports.Command
{
    public record StudentProgressSubmitFormDto(
        string TopicCode,
        string MilestoneCode,
        string StudentUserCode,
        string? StudentProfileCode,
        string? LecturerCode,
        string? ReportTitle,
        string? ReportDescription,
        int? AttemptNumber);
}

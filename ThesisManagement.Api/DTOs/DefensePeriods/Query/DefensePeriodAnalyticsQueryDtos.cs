namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class AnalyticsOverviewDto
    {
        public int TotalStudents { get; set; }
        public decimal Average { get; set; }
        public decimal PassRate { get; set; }
        public decimal Highest { get; set; }
        public decimal Lowest { get; set; }
        public string? HighestStudentCode { get; set; }
        public string? HighestStudentName { get; set; }
        public string? HighestTopicTitle { get; set; }
        public string? LowestStudentCode { get; set; }
        public string? LowestStudentName { get; set; }
        public string? LowestTopicTitle { get; set; }
    }

    public class CouncilAnalyticsDto
    {
        public int CouncilId { get; set; }
        public string CouncilCode { get; set; } = string.Empty;
        public string? Room { get; set; }
        public int Count { get; set; }
        public decimal Avg { get; set; }
        public decimal Max { get; set; }
        public decimal Min { get; set; }
    }

    public class AnalyticsDistributionDto
    {
        public int Excellent { get; set; }
        public int Good { get; set; }
        public int Fair { get; set; }
        public int Weak { get; set; }
    }

    public class ScoringMatrixRowDto
    {
        public int CommitteeId { get; set; }
        public string CommitteeCode { get; set; } = string.Empty;
        public string? Room { get; set; }
        public int AssignmentId { get; set; }
        public string AssignmentCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string TopicTitle { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public int SubmittedCount { get; set; }
        public int RequiredCount { get; set; }
        public bool IsLocked { get; set; }
        public decimal? FinalScore { get; set; }
        public string? FinalGrade { get; set; }
        public decimal? Variance { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ScoringProgressDto
    {
        public int CommitteeId { get; set; }
        public string CommitteeCode { get; set; } = string.Empty;
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public decimal ProgressPercent { get; set; }
    }

    public class ScoringAlertDto
    {
        public string AlertCode { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int CommitteeId { get; set; }
        public string CommitteeCode { get; set; } = string.Empty;
        public int AssignmentId { get; set; }
        public string AssignmentCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public decimal? Value { get; set; }
        public decimal? Threshold { get; set; }
    }
}

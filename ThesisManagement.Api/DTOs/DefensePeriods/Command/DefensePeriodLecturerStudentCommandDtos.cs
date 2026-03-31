using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class LecturerScoreSubmitDto
    {
        [Range(1, int.MaxValue)]
        public int AssignmentId { get; set; }

        [Range(0, 10)]
        public decimal Score { get; set; }

        public string? Comment { get; set; }
    }

    public class ReopenScoreRequestDto
    {
        [Range(1, int.MaxValue)]
        public int AssignmentId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class StudentRevisionSubmissionDto
    {
        [Range(1, int.MaxValue)]
        public int AssignmentId { get; set; }
        public string? RevisedContent { get; set; }
        public IFormFile? File { get; set; }
    }

    public class RejectRevisionRequestDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateLecturerMinutesDto
    {
        public int AssignmentId { get; set; }
        public string? SummaryContent { get; set; }
        public string? ReviewerComments { get; set; }
        public string? QnaDetails { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? Recommendations { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class DefensePeriodArchiveRequestDto
    {
        public bool ForceArchiveWithoutPublish { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }

        [MaxLength(128)]
        public string? IdempotencyKey { get; set; }
    }

    public class DefensePeriodReopenRequestDto
    {
        [MaxLength(500)]
        public string? Reason { get; set; }

        [MaxLength(128)]
        public string? IdempotencyKey { get; set; }
    }

    public class DefensePeriodStatusTransitionResponseDto
    {
        public int DefenseTermId { get; set; }
        public string StatusBefore { get; set; } = string.Empty;
        public string StatusAfter { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public DateTime ChangedAt { get; set; }
    }
}

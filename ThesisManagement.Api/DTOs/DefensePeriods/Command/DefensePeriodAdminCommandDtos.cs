using System.ComponentModel.DataAnnotations;

namespace ThesisManagement.Api.DTOs.DefensePeriods
{
    public class SyncDefensePeriodRequestDto
    {
        public bool RetryOnFailure { get; set; } = true;
        public string? IdempotencyKey { get; set; }
    }

    public class SyncDefensePeriodResponseDto
    {
        public int TotalPulled { get; set; }
        public int EligibleCount { get; set; }
        public int InvalidCount { get; set; }
        public int RetryAttempts { get; set; } = 1;
        public List<SyncRowErrorDto> RowErrors { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class SyncRowErrorDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public List<string> Errors { get; set; } = new();
    }

    public class UpdateDefensePeriodConfigDto
    {
        [Required]
        public List<string> Rooms { get; set; } = new();

        [Required]
        public string MorningStart { get; set; } = "07:30";

        [Required]
        public string AfternoonStart { get; set; } = "13:30";

        [Range(1, 10)]
        public int SoftMaxCapacity { get; set; } = 4;
    }

    public class ConfirmCouncilConfigDto
    {
        [Range(3, 7)]
        public int TopicsPerSessionConfig { get; set; } = 4;

        [Range(3, 7)]
        public int MembersPerCouncilConfig { get; set; } = 4;

        public List<string> Tags { get; set; } = new();
    }

    public class UpdateLecturerBusySlotsDto
    {
        [Required]
        public List<string> BusySlots { get; set; } = new();
    }

    public class GenerateCouncilsRequestDto
    {
        public List<string> SelectedRooms { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public string? IdempotencyKey { get; set; }
    }

    public class CouncilUpsertDto
    {
        [Required]
        public string Room { get; set; } = string.Empty;

        // Optimistic concurrency token from CouncilDraftDto.ConcurrencyToken (required for update).
        public string? ConcurrencyToken { get; set; }

        public List<string> CouncilTags { get; set; } = new();

        [Required]
        public List<string> MorningStudentCodes { get; set; } = new();

        [Required]
        public List<string> AfternoonStudentCodes { get; set; } = new();

        [Required]
        public List<CouncilMemberInputDto> Members { get; set; } = new();
    }

    public class CouncilMemberInputDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;

        [Required]
        public string LecturerCode { get; set; } = string.Empty;
    }

    public class FinalizeDefensePeriodDto
    {
        public bool AllowFinalizeAfterWarning { get; set; }
        public string? IdempotencyKey { get; set; }
    }
}

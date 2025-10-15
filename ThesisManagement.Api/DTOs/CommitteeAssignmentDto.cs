using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ThesisManagement.Api.DTOs
{
    // Requests / Init
    public class CommitteeCreateRequestDto
    {
        public string? CommitteeCode { get; set; }
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public List<string> TagCodes { get; set; } = new();
        public List<CommitteeMemberInputDto> Members { get; set; } = new();
        public List<CommitteeSessionCreateDto> Sessions { get; set; } = new();
        /// <summary>
        /// Backwards-compatible topic payload. Will be grouped into sessions automatically.
        /// </summary>
        public List<CommitteeTopicUpdateDto>? Topics { get; set; }
    }

    public class CommitteeMemberInputDto
    {
        public int LecturerProfileId { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsChair { get; set; }
    }

    public class CommitteeCreateInitDto
    {
        public string NextCode { get; set; } = string.Empty;
        public DateTime? DefaultDefenseDate { get; set; }
        public List<string> Rooms { get; set; } = new();
        public List<string> SuggestedTags { get; set; } = new();
    }

    public class CommitteeUpdateRequestDto
    {
        public string CommitteeCode { get; set; } = string.Empty; // convenience for service
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public List<string>? TagCodes { get; set; }
        public List<CommitteeMemberInputDto>? Members { get; set; }
        // Topics array for syncing DefenseAssignments when updating a committee
        public List<CommitteeTopicUpdateDto>? Topics { get; set; }
    }

    public class CommitteeTopicUpdateDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public int Session { get; set; }
        public DateTime? ScheduledAt { get; set; }
        // Accept times as strings "HH:mm:ss" or null
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }

    public class CommitteeSessionCreateDto
    {
        public int Session { get; set; }
        public List<CommitteeSessionTopicCreateDto> Topics { get; set; } = new();
    }

    public class CommitteeSessionTopicCreateDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public DateTime? ScheduledAt { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }

    public class CommitteeMembersUpdateRequestDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public List<CommitteeMemberRoleUpdateDto> Members { get; set; } = new();
    }

    public class CommitteeMembersCreateRequestDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public List<CommitteeMemberInputDto> Members { get; set; } = new();
    }

    public class CommitteeMemberRoleUpdateDto
    {
        public string Role { get; set; } = string.Empty;
        public string LecturerCode { get; set; } = string.Empty;
    }

    // Details / List
    public class CommitteeDetailDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public string? Status { get; set; }
        public List<TagDto> Tags { get; set; } = new();
        public List<CommitteeMemberSummaryDto> Members { get; set; } = new();
        /// <summary>
        /// Legacy flat assignment list. Prefer using <see cref="Sessions"/> for grouped schedule data.
        /// </summary>
        public List<CommitteeAssignmentItemDto> Assignments { get; set; } = new();
        public List<CommitteeSessionDto> Sessions { get; set; } = new();
    }

    public class CommitteeMemberSummaryDto
    {
        public int LecturerProfileId { get; set; }
        public string LecturerCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsChair { get; set; }
        public string? Degree { get; set; }
        public List<string> SpecialtyCodes { get; set; } = new();
        public List<string> SpecialtyNames { get; set; } = new();
    }

    public class CommitteeAssignmentItemDto
    {
        public string AssignmentCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? StudentCode { get; set; }
        public string? StudentName { get; set; }
        public string? SupervisorCode { get; set; }
        public string? SupervisorName { get; set; }
        public int? Session { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    public class CommitteeSessionDto
    {
        public int Session { get; set; }
        public List<CommitteeSessionTopicDto> Topics { get; set; } = new();
    }

    public class CommitteeSessionTopicDto
    {
        public string AssignmentCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? StudentCode { get; set; }
        public string? StudentName { get; set; }
        public string? SupervisorCode { get; set; }
        public string? SupervisorName { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }

    public class CommitteeSummaryDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public int MemberCount { get; set; }
        public int TopicCount { get; set; }
        public List<string> TagCodes { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdated { get; set; }
        public string? Status { get; set; }
    }

    // Assignment Requests
    public class AssignTopicRequestDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public DateTime? ScheduledAt { get; set; }
        public int? Session { get; set; }
        // Optional who assigns (frontend may send userCode); fallback to 'system' in service
        public string? AssignedBy { get; set; }

        [JsonPropertyName("items")]
        public List<AssignTopicItemDto> Items { get; set; } = new();

        [JsonPropertyName("topics")]
        public List<AssignTopicItemDto> Topics
        {
            get => Items;
            set => Items = value ?? new List<AssignTopicItemDto>();
        }
    }

    public class AssignTopicItemDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public int? Session { get; set; }
        public DateTime? ScheduledAt { get; set; }
        // Accept times as strings in format "HH:mm:ss" (or "HH:mm") from frontend/Swagger
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }

    public class AutoAssignRequestDto
    {
        public DateTime? Date { get; set; }
        public int? PerSessionLimit { get; set; }
        public List<string>? TagPriorities { get; set; }
    }

    public class ChangeAssignmentRequestDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public int Session { get; set; }
        // Accept times as strings from client in format "HH:mm:ss" (or "HH:mm").
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public DateTime ScheduledAt { get; set; }
    }

    // Availability
    public class AvailableLecturerDto
    {
        public int LecturerProfileId { get; set; }
        public string LecturerCode { get; set; } = string.Empty;
        // Full name from Users table
        public string FullName { get; set; } = string.Empty;
        // Backwards compatible alias
        public string Name { get => FullName; set { FullName = value; } }
        public string? DepartmentCode { get; set; }
        public string? Specialties { get; set; }
        // Optional single specialty code for frontend convenience
        public string? SpecialtyCode { get; set; }
        // New: academic degree, e.g. "Tiến sĩ", "Thạc sĩ"
        public string? Degree { get; set; }
        // New: whether lecturer is eligible to be chair (computed by service)
        public bool IsEligibleChair { get; set; } = false;
        public int DefenseQuota { get; set; }
        public int CurrentDefenseLoad { get; set; }
        public bool Availability { get; set; } = true;
    }

    public class AvailableTopicDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? StudentCode { get; set; }
        public string? StudentName { get; set; }
        public string? SupervisorCode { get; set; }
        public string? SupervisorName { get; set; }
        public string? DepartmentCode { get; set; }
        public string? SpecialtyCode { get; set; }
        public List<string> Tags { get; set; } = new();
        public List<string> TagDescriptions { get; set; } = new();
        public string? Status { get; set; }
    }

    // Lecturer / Student views
    public class LecturerCommitteesDto
    {
        public string LecturerCode { get; set; } = string.Empty;
        public List<CommitteeDetailDto> Committees { get; set; } = new();
    }

    public class StudentDefenseInfoDto
    {
        public string StudentCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public StudentCommitteeDto Committee { get; set; } = new();
    }

    public class StudentCommitteeDto
    {
        public string CommitteeCode { get; set; } = string.Empty;
        public string? Name { get; set; }
        public DateTime? DefenseDate { get; set; }
        public string? Room { get; set; }
        public int? Session { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public List<StudentCommitteeMemberDto> Members { get; set; } = new();
    }

    public class StudentCommitteeMemberDto
    {
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}

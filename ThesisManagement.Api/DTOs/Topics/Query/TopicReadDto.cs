using System;

namespace ThesisManagement.Api.DTOs.Topics.Query
{
    public record TopicReadDto(
        int TopicID,
        string TopicCode,
        string Title,
        string? Summary,
        string Type,
        int ProposerUserID,
        string? ProposerUserCode,
        int? ProposerStudentProfileID,
        string? ProposerStudentCode,
        int? SupervisorUserID,
        string? SupervisorUserCode,
        int? SupervisorLecturerProfileID,
        string? SupervisorLecturerCode,
        int? CatalogTopicID,
        string? CatalogTopicCode,
        int? DepartmentID,
        string? DepartmentCode,
        int? DefenseTermId,
        string Status,
        int? ResubmitCount,
        DateTime? CreatedAt,
        DateTime? LastUpdated,
        string? LecturerComment
    );
}
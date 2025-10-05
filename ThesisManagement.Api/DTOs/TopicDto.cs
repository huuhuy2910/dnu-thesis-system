using System;

namespace ThesisManagement.Api.DTOs
{
    public record TopicCreateDto(
        string TopicCode,
        string Title,
        string? Summary,
        string Type,
        int ProposerUserID,
        string ProposerUserCode,
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
        string Status,
        int? ResubmitCount,
        DateTime CreatedAt,
        DateTime LastUpdated,
        int? SpecialtyID,
        string? SpecialtyCode
    );

    public record TopicUpdateDto(
        string? Title,
        string? Summary,
        string? Status,
        int? SupervisorUserID,
        string? SupervisorUserCode,
        int? SupervisorLecturerProfileID,
        string? SupervisorLecturerCode,
        int? DepartmentID,
        string? DepartmentCode,
        int? SpecialtyID,
        string? SpecialtyCode
    );

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
        string Status,
        int? ResubmitCount,
        DateTime CreatedAt,
        DateTime LastUpdated,
        int? SpecialtyID,
        string? SpecialtyCode
    );
}

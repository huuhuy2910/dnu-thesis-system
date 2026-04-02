using System.Collections.Generic;

namespace ThesisManagement.Api.DTOs.Workflows.Command
{
    public record TopicResubmitWorkflowRequestDto(
        int? TopicID,
        string? TopicCode,
        string Title,
        string? Summary,
        string Type,
        int? ProposerUserID,
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
        IEnumerable<int>? TagIDs,
        IEnumerable<string>? TagCodes,
        bool? UseCatalogTopicTags,
        bool? ForceCreateNewTopic,
        string? StudentNote
    );

    public record TopicDecisionWorkflowRequestDto(
        string Action,
        string? Comment
    );
}

using System;

namespace ThesisManagement.Api.DTOs.MilestoneTemplates.Query
{
    public record MilestoneTemplateReadDto(
        int MilestoneTemplateID,
        string MilestoneTemplateCode,
        string Name,
        string? Description,
        int Ordinal,
        DateTime? Deadline,
        DateTime CreatedAt,
        DateTime? LastUpdated);
}
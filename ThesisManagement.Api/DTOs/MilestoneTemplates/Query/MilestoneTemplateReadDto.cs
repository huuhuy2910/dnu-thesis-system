using System;

namespace ThesisManagement.Api.DTOs.MilestoneTemplates.Query
{
    public record MilestoneTemplateReadDto(
        int MilestoneTemplateID,
        string MilestoneTemplateCode,
        string Name,
        string? Description,
        int Ordinal,
        DateTime CreatedAt,
        DateTime? LastUpdated);
}
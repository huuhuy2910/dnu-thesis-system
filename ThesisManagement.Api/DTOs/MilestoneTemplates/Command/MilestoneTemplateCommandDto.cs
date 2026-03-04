using System;

namespace ThesisManagement.Api.DTOs.MilestoneTemplates.Command
{
    public record MilestoneTemplateCreateDto(
        string MilestoneTemplateCode,
        string Name,
        string? Description,
        int Ordinal);

    public record MilestoneTemplateUpdateDto(
        string? Name,
        string? Description,
        int? Ordinal);
}
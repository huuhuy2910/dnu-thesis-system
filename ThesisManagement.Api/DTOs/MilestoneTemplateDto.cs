using System;

namespace ThesisManagement.Api.DTOs
{
    public record MilestoneTemplateCreateDto(string MilestoneTemplateCode, string Name, string? Description, int Ordinal);
    public record MilestoneTemplateUpdateDto(string? Name, string? Description, int? Ordinal);
    public record MilestoneTemplateReadDto(int MilestoneTemplateID, string MilestoneTemplateCode, string Name, string? Description, int Ordinal, DateTime CreatedAt, DateTime? LastUpdated);
}

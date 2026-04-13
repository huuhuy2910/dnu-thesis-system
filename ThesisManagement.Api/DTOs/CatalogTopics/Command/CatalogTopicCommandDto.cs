using System;

namespace ThesisManagement.Api.DTOs.CatalogTopics.Command
{
    public record CatalogTopicCreateDto(
        string Title,
        string? Summary,
        string? DepartmentCode,
        string? AssignedStatus,
        DateTime? AssignedAt);

    public record CatalogTopicUpdateDto(
        string? Title,
        string? Summary,
        string? DepartmentCode,
        string? AssignedStatus,
        DateTime? AssignedAt,
        IEnumerable<int>? TagIDs,
        IEnumerable<string>? TagCodes);
}
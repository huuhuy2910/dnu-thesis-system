using System;

namespace ThesisManagement.Api.DTOs
{
    public record CatalogTopicCreateDto(string Title, string? Summary, string? DepartmentCode, string? AssignedStatus, DateTime? AssignedAt);
    public record CatalogTopicUpdateDto(string? Title, string? Summary, string? DepartmentCode, string? AssignedStatus, DateTime? AssignedAt);
    public record CatalogTopicReadDto(int CatalogTopicID, string CatalogTopicCode, string Title, string? Summary, string? DepartmentCode, string? AssignedStatus, DateTime? AssignedAt, DateTime CreatedAt, DateTime LastUpdated);
}

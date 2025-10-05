using System;

namespace ThesisManagement.Api.DTOs
{
    public record CatalogTopicCreateDto(string Title, string? Summary, string? DepartmentCode);
    public record CatalogTopicUpdateDto(string? Title, string? Summary, string? DepartmentCode);
    public record CatalogTopicReadDto(int CatalogTopicID, string CatalogTopicCode, string Title, string? Summary, string? DepartmentCode, DateTime CreatedAt, DateTime LastUpdated);
}

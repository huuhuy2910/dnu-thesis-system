using System;

namespace ThesisManagement.Api.DTOs
{
    public record CatalogTopicSpecialtyCreateDto(int CatalogTopicID, int SpecialtyID, string? CatalogTopicCode, string? SpecialtyCode);
    public record CatalogTopicSpecialtyUpdateDto(DateTime? CreatedAt, string? CatalogTopicCode, string? SpecialtyCode);
    public record CatalogTopicSpecialtyReadDto(int CatalogTopicID, int SpecialtyID, string? CatalogTopicCode, string? SpecialtyCode, DateTime CreatedAt);
}

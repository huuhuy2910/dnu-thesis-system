using System;

namespace ThesisManagement.Api.DTOs
{
    public record CatalogTopicTagReadDto(
        int CatalogTopicID,
        int TagID,
        string? CatalogTopicCode,
        string? TagCode,
        DateTime CreatedAt
    );

    public record CatalogTopicTagCreateDto(
        int? CatalogTopicID,
        int? TagID,
        string? CatalogTopicCode,
        string? TagCode
    );

    public record CatalogTopicTagUpdateDto(
        int? CatalogTopicID,
        int? TagID,
        string? CatalogTopicCode,
        string? TagCode
    );
}

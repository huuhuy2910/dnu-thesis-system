using System;

namespace ThesisManagement.Api.DTOs.CatalogTopicTags.Query
{
    public record CatalogTopicTagReadDto(
        int CatalogTopicID,
        int TagID,
        string? CatalogTopicCode,
        string? TagCode,
        DateTime CreatedAt
    );
}
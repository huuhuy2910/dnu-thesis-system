using System;

namespace ThesisManagement.Api.DTOs.TopicTags.Query
{
    public record TopicTagReadDto(
        int TopicTagID,
        string? CatalogTopicCode,
        string? TopicCode,
        int TagID,
        string? TagCode,
        DateTime CreatedAt
    );
}
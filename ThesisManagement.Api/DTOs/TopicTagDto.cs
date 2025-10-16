using System;

namespace ThesisManagement.Api.DTOs
{
    public record TopicTagReadDto(
        int TopicTagID,
        string? CatalogTopicCode,
        string? TopicCode,
        int TagID,
        string? TagCode,
        DateTime CreatedAt
    );

    public record TopicTagCreateDto(
        int? TagID,
        string? TagCode,
        string? CatalogTopicCode,
        string? TopicCode
    );

    public record TopicTagUpdateDto(
        int? TagID,
        string? TagCode
    );

    public record TopicTagReplaceDto(
        string TopicCode,
        IEnumerable<int>? TagIDs,
        IEnumerable<string>? TagCodes
    );
}

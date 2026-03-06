using System.Collections.Generic;

namespace ThesisManagement.Api.DTOs.TopicTags.Command
{
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
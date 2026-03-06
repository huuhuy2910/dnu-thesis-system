namespace ThesisManagement.Api.DTOs.CatalogTopicTags.Command
{
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
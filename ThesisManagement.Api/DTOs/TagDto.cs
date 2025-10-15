using System;

namespace ThesisManagement.Api.DTOs
{
    public record TagReadDto(
        int TagID,
        string TagCode,
        string TagName,
        string? Description,
        DateTime CreatedAt
    );

    public record TagCreateDto(
        string TagCode,
        string TagName,
        string? Description
    );

    public record TagUpdateDto(
        string? TagName,
        string? Description
    );
}

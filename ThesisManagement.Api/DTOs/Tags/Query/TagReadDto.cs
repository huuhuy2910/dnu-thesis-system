using System;

namespace ThesisManagement.Api.DTOs.Tags.Query
{
    public record TagReadDto(
        int TagID,
        string TagCode,
        string TagName,
        string? Description,
        DateTime CreatedAt
    );
}
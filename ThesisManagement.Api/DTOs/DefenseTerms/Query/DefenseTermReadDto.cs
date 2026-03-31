using System;

namespace ThesisManagement.Api.DTOs.DefenseTerms.Query
{
    public record DefenseTermReadDto(
        int DefenseTermId,
        string Name,
        DateTime StartDate,
        string? ConfigJson,
        string Status,
        DateTime CreatedAt,
        DateTime LastUpdated);
}
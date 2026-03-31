using System;

namespace ThesisManagement.Api.DTOs.DefenseTerms.Command
{
    public record DefenseTermCreateDto(
        string Name,
        DateTime StartDate,
        string? ConfigJson,
        string? Status,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record DefenseTermUpdateDto(
        string? Name,
        DateTime? StartDate,
        string? ConfigJson,
        string? Status,
        DateTime? CreatedAt,
        DateTime? LastUpdated);
}
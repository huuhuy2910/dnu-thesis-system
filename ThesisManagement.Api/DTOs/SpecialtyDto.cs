using System;

namespace ThesisManagement.Api.DTOs
{
    public record SpecialtyCreateDto(string Name, string? Description);
    public record SpecialtyUpdateDto(string? Name, string? Description);
    public record SpecialtyReadDto(int SpecialtyID, string SpecialtyCode, string Name, string? Description, DateTime CreatedAt, DateTime LastUpdated);
}
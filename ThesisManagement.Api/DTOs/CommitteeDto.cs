using System;

namespace ThesisManagement.Api.DTOs
{
    public record CommitteeCreateDto(string? Name, DateTime? DefenseDate, string? Room);
    public record CommitteeUpdateDto(string? Name, DateTime? DefenseDate, string? Room);
    public record CommitteeReadDto(int CommitteeID, string CommitteeCode, string? Name, DateTime? DefenseDate, string? Room, DateTime CreatedAt, DateTime LastUpdated);
}

using System;

namespace ThesisManagement.Api.DTOs
{
    public record DepartmentCreateDto(string Name, string? Description);
    public record DepartmentUpdateDto(string? Name, string? Description);
    public record DepartmentReadDto(int DepartmentID, string DepartmentCode, string Name, string? Description, DateTime CreatedAt, DateTime LastUpdated);
}

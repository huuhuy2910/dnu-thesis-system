using System;

namespace ThesisManagement.Api.DTOs.Departments.Query
{
    public record DepartmentReadDto(int DepartmentID, string DepartmentCode, string Name, string? Description, DateTime CreatedAt, DateTime LastUpdated);
}
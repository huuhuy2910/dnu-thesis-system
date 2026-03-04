namespace ThesisManagement.Api.DTOs.Departments.Command
{
    public record DepartmentCreateDto(string Name, string? Description);
    public record DepartmentUpdateDto(string? Name, string? Description);
}
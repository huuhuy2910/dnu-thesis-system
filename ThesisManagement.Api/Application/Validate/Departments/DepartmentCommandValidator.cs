using ThesisManagement.Api.DTOs.Departments.Command;

namespace ThesisManagement.Api.Application.Validate.Departments
{
    public static class DepartmentCommandValidator
    {
        public static string? ValidateCreate(DepartmentCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Name is required";

            return null;
        }

        public static string? ValidateUpdate(DepartmentUpdateDto dto)
        {
            if (dto.Name is not null && string.IsNullOrWhiteSpace(dto.Name))
                return "Name cannot be empty";

            return null;
        }
    }
}

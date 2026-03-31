using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;

namespace ThesisManagement.Api.Application.Validate.DefenseTermStudents
{
    public static class DefenseTermStudentCommandValidator
    {
        public static string? ValidateCreate(DefenseTermStudentCreateDto dto)
        {
            if (dto.DefenseTermId <= 0)
                return "DefenseTermId is required";

            if (dto.StudentProfileID is null && string.IsNullOrWhiteSpace(dto.StudentCode))
                return "StudentProfileID or StudentCode is required";

            return null;
        }
    }
}
using ThesisManagement.Api.DTOs.DefenseTermLecturers.Command;

namespace ThesisManagement.Api.Application.Validate.DefenseTermLecturers
{
    public static class DefenseTermLecturerCommandValidator
    {
        public static string? ValidateCreate(DefenseTermLecturerCreateDto dto)
        {
            if (dto.DefenseTermId <= 0)
                return "DefenseTermId is required";

            if (dto.LecturerProfileID is null && string.IsNullOrWhiteSpace(dto.LecturerCode))
                return "LecturerProfileID or LecturerCode is required";

            return null;
        }
    }
}
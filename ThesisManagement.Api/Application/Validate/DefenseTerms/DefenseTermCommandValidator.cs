using ThesisManagement.Api.DTOs.DefenseTerms.Command;

namespace ThesisManagement.Api.Application.Validate.DefenseTerms
{
    public static class DefenseTermCommandValidator
    {
        public static string? ValidateCreate(DefenseTermCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Name is required";

            if (dto.StartDate == default)
                return "StartDate is required";

            return null;
        }

        public static string? ValidateUpdate(DefenseTermUpdateDto dto)
        {
            if (dto.Name is not null && string.IsNullOrWhiteSpace(dto.Name))
                return "Name cannot be empty";

            return null;
        }
    }
}
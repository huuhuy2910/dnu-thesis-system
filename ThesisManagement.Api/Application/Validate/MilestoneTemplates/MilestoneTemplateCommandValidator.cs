using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;

namespace ThesisManagement.Api.Application.Validate.MilestoneTemplates
{
    public static class MilestoneTemplateCommandValidator
    {
        public static string? ValidateCreate(MilestoneTemplateCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Name is required";
            if (dto.Ordinal <= 0)
                return "Ordinal must be greater than zero";

            return null;
        }

        public static string? ValidateUpdate(MilestoneTemplateUpdateDto dto)
        {
            if (dto.Name is not null && string.IsNullOrWhiteSpace(dto.Name))
                return "Name cannot be empty";
            if (dto.Ordinal.HasValue && dto.Ordinal <= 0)
                return "Ordinal must be greater than zero";

            return null;
        }
    }
}

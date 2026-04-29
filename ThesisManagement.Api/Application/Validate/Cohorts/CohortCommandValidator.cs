using ThesisManagement.Api.DTOs.Cohorts.Command;

namespace ThesisManagement.Api.Application.Validate.Cohorts
{
    public static class CohortCommandValidator
    {
        public static string? ValidateCreate(CohortCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CohortName))
                return "CohortName is required";

            if (dto.StartYear <= 0)
                return "StartYear must be greater than zero";

            if (dto.EndYear <= 0)
                return "EndYear must be greater than zero";

            if (dto.StartYear > dto.EndYear)
                return "StartYear cannot be greater than EndYear";

            if (dto.Status.HasValue && dto.Status.Value is not (0 or 1))
                return "Status must be 0 or 1";

            return null;
        }

        public static string? ValidateUpdate(CohortUpdateDto dto)
        {
            if (dto.CohortName is not null && string.IsNullOrWhiteSpace(dto.CohortName))
                return "CohortName cannot be empty";

            if (dto.StartYear.HasValue && dto.StartYear.Value <= 0)
                return "StartYear must be greater than zero";

            if (dto.EndYear.HasValue && dto.EndYear.Value <= 0)
                return "EndYear must be greater than zero";

            if (dto.StartYear.HasValue && dto.EndYear.HasValue && dto.StartYear.Value > dto.EndYear.Value)
                return "StartYear cannot be greater than EndYear";

            if (dto.Status.HasValue && dto.Status.Value is not (0 or 1))
                return "Status must be 0 or 1";

            return null;
        }
    }
}
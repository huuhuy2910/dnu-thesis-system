using ThesisManagement.Api.DTOs.CatalogTopics.Command;

namespace ThesisManagement.Api.Application.Validate.CatalogTopics
{
    public static class CatalogTopicCommandValidator
    {
        public static string? ValidateCreate(CatalogTopicCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return "Title is required";

            return null;
        }

        public static string? ValidateUpdate(CatalogTopicUpdateDto dto)
        {
            if (dto.Title is not null && string.IsNullOrWhiteSpace(dto.Title))
                return "Title cannot be empty";

            return null;
        }
    }
}

using ThesisManagement.Api.DTOs.CatalogTopicTags.Command;

namespace ThesisManagement.Api.Application.Validate.CatalogTopicTags
{
    public static class CatalogTopicTagCommandValidator
    {
        public static string? ValidateCreate(CatalogTopicTagCreateDto dto)
        {
            if ((dto.CatalogTopicID ?? 0) <= 0 && string.IsNullOrWhiteSpace(dto.CatalogTopicCode))
                return "CatalogTopicID or CatalogTopicCode is required";

            if ((dto.TagID ?? 0) <= 0 && string.IsNullOrWhiteSpace(dto.TagCode))
                return "TagID or TagCode is required";

            return null;
        }
    }
}

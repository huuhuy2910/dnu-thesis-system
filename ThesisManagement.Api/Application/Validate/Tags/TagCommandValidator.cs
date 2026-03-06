using ThesisManagement.Api.DTOs.Tags.Command;

namespace ThesisManagement.Api.Application.Validate.Tags
{
    public static class TagCommandValidator
    {
        public static string? ValidateCreate(TagCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TagName))
                return "TagName is required";

            return null;
        }

        public static string? ValidateUpdate(TagUpdateDto dto)
        {
            if (dto.TagName is not null && string.IsNullOrWhiteSpace(dto.TagName))
                return "TagName cannot be empty";

            return null;
        }
    }
}

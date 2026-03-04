using ThesisManagement.Api.DTOs.Topics.Command;

namespace ThesisManagement.Api.Application.Validate.Topics
{
    public static class TopicCommandValidator
    {
        public static string? ValidateCreate(TopicCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return "Title is required";

            if (string.IsNullOrWhiteSpace(dto.Type))
                return "Type is required";

            return null;
        }
    }
}

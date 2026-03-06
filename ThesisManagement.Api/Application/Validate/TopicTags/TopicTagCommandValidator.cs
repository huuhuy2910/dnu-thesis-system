using ThesisManagement.Api.DTOs.TopicTags.Command;

namespace ThesisManagement.Api.Application.Validate.TopicTags
{
    public static class TopicTagCommandValidator
    {
        public static string? ValidateCreate(TopicTagCreateDto dto)
        {
            if ((dto.TagID ?? 0) <= 0 && string.IsNullOrWhiteSpace(dto.TagCode))
                return "TagID (or TagCode) is required";
            return null;
        }

        public static string? ValidateCreateByTopicCode(string topicCode, TopicTagCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(topicCode)) return "TopicCode is required";
            if ((dto.TagID ?? 0) <= 0 && string.IsNullOrWhiteSpace(dto.TagCode))
                return "TagID or TagCode is required";
            return null;
        }
    }
}

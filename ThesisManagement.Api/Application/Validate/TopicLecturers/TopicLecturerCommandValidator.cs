using ThesisManagement.Api.DTOs.TopicLecturers.Command;

namespace ThesisManagement.Api.Application.Validate.TopicLecturers
{
    public static class TopicLecturerCommandValidator
    {
        public static string? ValidateCreate(TopicLecturerCreateDto dto)
        {
            if (!dto.TopicID.HasValue && string.IsNullOrWhiteSpace(dto.TopicCode))
                return "Either TopicID or TopicCode must be provided";
            if (!dto.LecturerProfileID.HasValue && string.IsNullOrWhiteSpace(dto.LecturerCode))
                return "Either LecturerProfileID or LecturerCode must be provided";
            return null;
        }
    }
}

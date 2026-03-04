using ThesisManagement.Api.DTOs.LecturerTags.Command;

namespace ThesisManagement.Api.Application.Validate.LecturerTags
{
    public static class LecturerTagCommandValidator
    {
        public static string? ValidateCreate(LecturerTagCreateDto dto)
        {
            if (dto.LecturerProfileID <= 0 && string.IsNullOrWhiteSpace(dto.LecturerCode))
                return "LecturerProfileID or LecturerCode is required";
            if (dto.TagID <= 0 && string.IsNullOrWhiteSpace(dto.TagCode))
                return "TagID or TagCode is required";

            return null;
        }

        public static string? ValidateUpdate(LecturerTagUpdateDto dto)
        {
            if (dto.LecturerProfileID.HasValue && dto.LecturerProfileID <= 0)
                return "LecturerProfileID must be positive";
            if (dto.TagID.HasValue && dto.TagID <= 0)
                return "TagID must be positive";
            return null;
        }
    }
}

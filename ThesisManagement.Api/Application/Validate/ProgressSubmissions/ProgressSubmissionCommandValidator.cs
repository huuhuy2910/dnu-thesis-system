using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;

namespace ThesisManagement.Api.Application.Validate.ProgressSubmissions
{
    public static class ProgressSubmissionCommandValidator
    {
        public static string? ValidateCreate(ProgressSubmissionCreateDto dto)
        {
            if (dto.MilestoneID.HasValue && dto.MilestoneID <= 0)
                return "MilestoneID must be positive";
            if (string.IsNullOrWhiteSpace(dto.MilestoneCode))
                return "MilestoneCode is required";
            if (dto.StudentUserID.HasValue && dto.StudentUserID <= 0)
                return "StudentUserID must be positive";
            if (string.IsNullOrWhiteSpace(dto.StudentUserCode))
                return "StudentUserCode is required";
            if (dto.StudentProfileID.HasValue && dto.StudentProfileID <= 0)
                return "StudentProfileID must be positive";
            if (dto.LecturerProfileID.HasValue && dto.LecturerProfileID <= 0)
                return "LecturerProfileID must be positive";
            return null;
        }
    }
}

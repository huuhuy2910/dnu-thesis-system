using ThesisManagement.Api.DTOs.DefenseScores.Command;

namespace ThesisManagement.Api.Application.Validate.DefenseScores
{
    public static class DefenseScoreCommandValidator
    {
        public static string? ValidateCreate(DefenseScoreCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.AssignmentCode))
                return "AssignmentCode is required";
            if (string.IsNullOrWhiteSpace(dto.MemberLecturerUserCode))
                return "MemberLecturerUserCode is required";
            if (dto.Score < 0)
                return "Score must be greater than or equal to 0";

            return null;
        }

        public static string? ValidateUpdate(DefenseScoreUpdateDto dto)
        {
            if (dto.Score.HasValue && dto.Score.Value < 0)
                return "Score must be greater than or equal to 0";

            return null;
        }
    }
}

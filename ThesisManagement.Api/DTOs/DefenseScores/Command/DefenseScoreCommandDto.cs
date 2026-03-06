namespace ThesisManagement.Api.DTOs.DefenseScores.Command
{
    public record DefenseScoreCreateDto(string AssignmentCode, string MemberLecturerUserCode, string? MemberLecturerCode, decimal Score, string? Comment);
    public record DefenseScoreUpdateDto(decimal? Score, string? Comment);
}
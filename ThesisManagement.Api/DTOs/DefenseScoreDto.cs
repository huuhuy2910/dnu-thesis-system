using System;

namespace ThesisManagement.Api.DTOs
{
    public record DefenseScoreCreateDto(string AssignmentCode, string MemberLecturerUserCode, string? MemberLecturerCode, decimal Score, string? Comment);
    public record DefenseScoreUpdateDto(decimal? Score, string? Comment);
    public record DefenseScoreReadDto(int ScoreID, string ScoreCode, string? AssignmentCode, string? MemberLecturerUserCode, string? MemberLecturerCode, decimal Score, string? Comment, DateTime CreatedAt, DateTime LastUpdated);
}

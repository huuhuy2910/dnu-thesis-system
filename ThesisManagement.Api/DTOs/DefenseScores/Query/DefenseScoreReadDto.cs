using System;

namespace ThesisManagement.Api.DTOs.DefenseScores.Query
{
    public record DefenseScoreReadDto(int ScoreID, string ScoreCode, string? AssignmentCode, string? MemberLecturerUserCode, string? MemberLecturerCode, decimal Score, string? Comment, DateTime CreatedAt, DateTime LastUpdated);
}
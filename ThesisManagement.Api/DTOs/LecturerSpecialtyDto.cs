using System;

namespace ThesisManagement.Api.DTOs
{
    public record LecturerSpecialtyCreateDto(int LecturerProfileID, int SpecialtyID, string? LecturerCode, string? SpecialtyCode);
    public record LecturerSpecialtyReadDto(int LecturerProfileID, int SpecialtyID, string? LecturerCode, string? SpecialtyCode, DateTime CreatedAt);
}
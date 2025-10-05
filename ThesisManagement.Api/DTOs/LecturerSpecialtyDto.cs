using System;

namespace ThesisManagement.Api.DTOs
{
    public record LecturerSpecialtyCreateDto(int LecturerProfileID, int SpecialtyID);
    public record LecturerSpecialtyReadDto(int LecturerProfileID, int SpecialtyID, DateTime CreatedAt);
}
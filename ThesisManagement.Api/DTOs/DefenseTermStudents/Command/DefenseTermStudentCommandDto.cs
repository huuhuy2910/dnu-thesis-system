using System;

namespace ThesisManagement.Api.DTOs.DefenseTermStudents.Command
{
    public record DefenseTermStudentCreateDto(
        int DefenseTermId,
        int? StudentProfileID,
        string? StudentCode,
        string? UserCode,
        DateTime? CreatedAt,
        DateTime? LastUpdated);

    public record DefenseTermStudentUpdateDto(
        int? DefenseTermId,
        int? StudentProfileID,
        string? StudentCode,
        string? UserCode,
        DateTime? CreatedAt,
        DateTime? LastUpdated);
}
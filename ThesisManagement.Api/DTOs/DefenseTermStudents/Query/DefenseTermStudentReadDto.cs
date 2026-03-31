using System;

namespace ThesisManagement.Api.DTOs.DefenseTermStudents.Query
{
    public record DefenseTermStudentReadDto(
        int DefenseTermStudentID,
        int DefenseTermId,
        int StudentProfileID,
        string StudentCode,
        string UserCode,
        DateTime CreatedAt,
        DateTime LastUpdated);
}
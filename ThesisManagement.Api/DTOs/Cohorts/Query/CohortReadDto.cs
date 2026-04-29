using System;

namespace ThesisManagement.Api.DTOs.Cohorts.Query
{
    public record CohortReadDto(
        int Id,
        string CohortCode,
        string CohortName,
        int StartYear,
        int EndYear,
        int Status,
        DateTime? CreatedAt,
        DateTime? UpdatedAt);
}
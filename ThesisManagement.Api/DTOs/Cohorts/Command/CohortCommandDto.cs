namespace ThesisManagement.Api.DTOs.Cohorts.Command
{
    public record CohortCreateDto(
        string CohortName,
        int StartYear,
        int EndYear,
        int? Status);

    public record CohortUpdateDto(
        string? CohortName,
        int? StartYear,
        int? EndYear,
        int? Status);
}
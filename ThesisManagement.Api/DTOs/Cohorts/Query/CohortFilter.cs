namespace ThesisManagement.Api.DTOs.Cohorts.Query
{
    public class CohortFilter : BaseFilter
    {
        public string? CohortCode { get; set; }
        public string? CohortName { get; set; }
        public int? Status { get; set; }
        public int? MinStartYear { get; set; }
        public int? MaxStartYear { get; set; }
        public int? MinEndYear { get; set; }
        public int? MaxEndYear { get; set; }
    }
}
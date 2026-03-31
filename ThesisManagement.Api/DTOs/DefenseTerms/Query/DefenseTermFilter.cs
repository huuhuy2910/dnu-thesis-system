using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.DTOs.DefenseTerms.Query
{
    public class DefenseTermFilter : BaseFilter
    {
        public string? Name { get; set; }
        public string? Status { get; set; }
        public DateTime? StartFromDate { get; set; }
        public DateTime? StartToDate { get; set; }
    }
}
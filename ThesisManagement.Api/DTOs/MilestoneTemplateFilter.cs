using System;

namespace ThesisManagement.Api.DTOs
{
    public class MilestoneTemplateFilter : BaseFilter
    {
        public string? MilestoneTemplateCode { get; set; }
        public string? Name { get; set; }
        public int? MinOrdinal { get; set; }
        public int? MaxOrdinal { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
    }
}

using System;

namespace ThesisManagement.Api.DTOs
{
    public class LecturerTagFilter : BaseFilter
    {
        public int? LecturerProfileID { get; set; }
        public string? LecturerCode { get; set; }
        public int? TagID { get; set; }
        public string? TagCode { get; set; }
        // Accept multiple tag codes via repeated query param or comma-separated values
        public IEnumerable<string>? TagCodes { get; set; }
        public int? AssignedByUserID { get; set; }
        public string? AssignedByUserCode { get; set; }
        public DateTime? AssignedFromDate { get; set; }
        public DateTime? AssignedToDate { get; set; }
    }
}

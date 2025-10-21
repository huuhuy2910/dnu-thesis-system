namespace ThesisManagement.Api.DTOs
{
    public class LecturerProfileFilter : BaseFilter
    {
        // Support filtering by multiple lecturer codes at once (e.g., ?lecturerCodes=LEC001&lecturerCodes=LEC002 or ?lecturerCodes=LEC001,LEC002)
        public IEnumerable<string>? LecturerCodes { get; set; }

        public string? UserCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? LecturerCode { get; set; }
        public string? Degree { get; set; }
        public int? MinGuideQuota { get; set; }
        public int? MaxGuideQuota { get; set; }
        public int? MinDefenseQuota { get; set; }
        public int? MaxDefenseQuota { get; set; }
        public IEnumerable<string>? TagCodes { get; set; }
        public string? Tags { get; set; }
    }
}
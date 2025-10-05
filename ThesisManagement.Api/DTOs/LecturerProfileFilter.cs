namespace ThesisManagement.Api.DTOs
{
    public class LecturerProfileFilter : BaseFilter
    {
        public string? UserCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? LecturerCode { get; set; }
        public string? Degree { get; set; }
        public int? MinGuideQuota { get; set; }
        public int? MaxGuideQuota { get; set; }
        public int? MinDefenseQuota { get; set; }
        public int? MaxDefenseQuota { get; set; }
    }
}
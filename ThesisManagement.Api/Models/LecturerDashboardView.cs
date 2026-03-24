namespace ThesisManagement.Api.Models
{
    public class LecturerDashboardView
    {
        public int LecturerProfileID { get; set; }
        public string LecturerCode { get; set; } = null!;
        public string? FullName { get; set; }
        public string? DepartmentCode { get; set; }
        public string? Degree { get; set; }
        public int GuideQuota { get; set; }
        public int DefenseQuota { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfileImage { get; set; }
        public int CurrentGuidingCount { get; set; }
    }
}

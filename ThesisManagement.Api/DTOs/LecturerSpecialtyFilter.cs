namespace ThesisManagement.Api.DTOs
{
    public class LecturerSpecialtyFilter : BaseFilter
    {
        public string? LecturerCode { get; set; }
        public string? SpecialtyCode { get; set; }
    }
}
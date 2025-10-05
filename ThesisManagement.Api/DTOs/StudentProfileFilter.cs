namespace ThesisManagement.Api.DTOs
{
    public class StudentProfileFilter : BaseFilter
    {
        public string? UserCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? StudentCode { get; set; }
        public string? ClassCode { get; set; }
        public string? FacultyCode { get; set; }
        public decimal? MinGPA { get; set; }
        public decimal? MaxGPA { get; set; }
        public string? AcademicStanding { get; set; }
    }
}
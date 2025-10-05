namespace ThesisManagement.Api.DTOs
{
    public class DepartmentFilter : BaseFilter
    {
        public string? Name { get; set; }
        public string? DepartmentCode { get; set; }
    }
}
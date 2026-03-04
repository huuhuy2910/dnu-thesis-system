namespace ThesisManagement.Api.DTOs.Departments.Query
{
    public class DepartmentFilter : BaseFilter
    {
        public string? Name { get; set; }
        public string? DepartmentCode { get; set; }
    }
}
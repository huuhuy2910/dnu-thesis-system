using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.DTOs.DefenseTermStudents.Query
{
    public class DefenseTermStudentFilter : BaseFilter
    {
        public int? DefenseTermId { get; set; }
        public int? StudentProfileID { get; set; }
        public string? StudentCode { get; set; }
        public string? UserCode { get; set; }
    }
}
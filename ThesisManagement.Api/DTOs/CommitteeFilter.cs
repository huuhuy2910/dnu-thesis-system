namespace ThesisManagement.Api.DTOs
{
    public class CommitteeFilter : BaseFilter
    {
        public string? Name { get; set; }
        public string? CommitteeCode { get; set; }
        public string? Room { get; set; }
        public DateTime? DefenseDate { get; set; }
    }
}

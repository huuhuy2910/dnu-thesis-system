namespace ThesisManagement.Api.Models
{
    public class DefenseGroup
    {
        public int DefenseGroupId { get; set; }
        public int TermId { get; set; }
        public string SlotId { get; set; } = string.Empty;
        public string StudentCodesJson { get; set; } = "[]";
        public DateTime CreatedAt { get; set; }
    }
}

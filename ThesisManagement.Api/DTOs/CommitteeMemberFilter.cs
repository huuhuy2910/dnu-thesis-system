namespace ThesisManagement.Api.DTOs
{
    public class CommitteeMemberFilter : BaseFilter
    {
        public string? CommitteeCode { get; set; }
        public string? LecturerUserCode { get; set; }
        public string? LecturerCode { get; set; }
        public string? Role { get; set; }
    }
}

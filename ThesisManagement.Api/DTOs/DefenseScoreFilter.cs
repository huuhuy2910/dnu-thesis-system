namespace ThesisManagement.Api.DTOs
{
    public class DefenseScoreFilter : BaseFilter
    {
        public string? ScoreCode { get; set; }
        public string? AssignmentCode { get; set; }
        public string? MemberLecturerUserCode { get; set; }
        public string? MemberLecturerCode { get; set; }
        public decimal? MinScore { get; set; }
        public decimal? MaxScore { get; set; }
    }
}
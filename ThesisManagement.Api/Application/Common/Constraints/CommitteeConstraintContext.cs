namespace ThesisManagement.Api.Application.Common.Constraints
{
    public sealed class CommitteeConstraintContext
    {
        public int CommitteeId { get; set; }
        public List<string> TopicCodes { get; set; } = new();
        public List<(DateTime Date, int Session)> Slots { get; set; } = new();
    }
}

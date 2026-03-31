namespace ThesisManagement.Api.Application.Common.Constraints
{
    public interface ICommitteeConstraintRule : IConstraintRule
    {
        string RuleKey { get; }
    }
}

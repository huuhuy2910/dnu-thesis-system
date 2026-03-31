namespace ThesisManagement.Api.Application.Common.Constraints
{
    public interface IConstraintRule
    {
        Task ValidateAsync(CommitteeConstraintContext context, CancellationToken cancellationToken);
    }
}
using ThesisManagement.Api.Application.Common.Constraints;

namespace ThesisManagement.Api.Application.Common
{
    public interface ICommitteeConstraintService
    {
        Task EnsureRequiredRolesAsync(int committeeId, CancellationToken cancellationToken);
        Task EnsureNoLecturerOverlapAsync(int committeeId, List<(DateTime Date, int Session)> slots, CancellationToken cancellationToken);
        Task EnsureUniqueStudentAssignmentAsync(int currentCommitteeId, IEnumerable<string> topicCodes, CancellationToken cancellationToken);
        Task ValidateBeforeAssignmentAsync(int committeeId, IEnumerable<string> topicCodes, List<(DateTime Date, int Session)> slots, CancellationToken cancellationToken);
    }

    public sealed class CommitteeConstraintService : ICommitteeConstraintService
    {
        private readonly Dictionary<string, ICommitteeConstraintRule> _rules;

        public CommitteeConstraintService(IEnumerable<ICommitteeConstraintRule> rules)
        {
            _rules = rules
                .GroupBy(x => x.RuleKey, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
        }

        public async Task EnsureRequiredRolesAsync(int committeeId, CancellationToken cancellationToken)
        {
            var context = new CommitteeConstraintContext
            {
                CommitteeId = committeeId
            };

            await ExecuteRulesAsync(context, new[] { "RoleRequirement" }, cancellationToken);
        }

        public async Task EnsureNoLecturerOverlapAsync(int committeeId, List<(DateTime Date, int Session)> slots, CancellationToken cancellationToken)
        {
            var context = new CommitteeConstraintContext
            {
                CommitteeId = committeeId,
                Slots = slots
            };

            await ExecuteRulesAsync(context, new[] { "LecturerOverlap" }, cancellationToken);
        }

        public async Task EnsureUniqueStudentAssignmentAsync(int currentCommitteeId, IEnumerable<string> topicCodes, CancellationToken cancellationToken)
        {
            var context = new CommitteeConstraintContext
            {
                CommitteeId = currentCommitteeId,
                TopicCodes = topicCodes
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .ToList()
            };

            await ExecuteRulesAsync(context, new[] { "UniqueStudentAssignment" }, cancellationToken);
        }

        public async Task ValidateBeforeAssignmentAsync(int committeeId, IEnumerable<string> topicCodes, List<(DateTime Date, int Session)> slots, CancellationToken cancellationToken)
        {
            var context = new CommitteeConstraintContext
            {
                CommitteeId = committeeId,
                TopicCodes = topicCodes
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                Slots = slots
            };

            await ExecuteRulesAsync(
                context,
                new[]
                {
                    "RoleRequirement",
                    "UniqueStudentAssignment",
                    "LecturerOverlap",
                    "SupervisorConflict"
                },
                cancellationToken);
        }

        private async Task ExecuteRulesAsync(CommitteeConstraintContext context, IEnumerable<string> ruleKeys, CancellationToken cancellationToken)
        {
            foreach (var key in ruleKeys)
            {
                if (!_rules.TryGetValue(key, out var rule))
                {
                    continue;
                }

                await rule.ValidateAsync(context, cancellationToken);
            }
        }
    }
}

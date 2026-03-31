using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;

namespace ThesisManagement.Api.Application.Common.Constraints
{
    public sealed class SupervisorConflictRule : ICommitteeConstraintRule
    {
        private readonly ApplicationDbContext _db;

        public SupervisorConflictRule(ApplicationDbContext db)
        {
            _db = db;
        }

        public string RuleKey => "SupervisorConflict";

        public async Task ValidateAsync(CommitteeConstraintContext context, CancellationToken cancellationToken)
        {
            var normalizedTopicCodes = context.TopicCodes
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (normalizedTopicCodes.Count == 0)
            {
                return;
            }

            var supervisors = await _db.Topics.AsNoTracking()
                .Where(x => normalizedTopicCodes.Contains(x.TopicCode) && x.SupervisorLecturerCode != null)
                .Select(x => x.SupervisorLecturerCode!)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (supervisors.Count == 0)
            {
                return;
            }

            var members = await _db.CommitteeMembers.AsNoTracking()
                .Where(x => x.CommitteeID == context.CommitteeId && x.MemberLecturerCode != null)
                .Select(x => x.MemberLecturerCode!)
                .ToListAsync(cancellationToken);

            var hasConflict = members.Any(x => supervisors.Contains(x, StringComparer.OrdinalIgnoreCase));
            if (hasConflict)
            {
                throw new BusinessRuleException(
                    "Vi phạm ràng buộc GVHD không được chấm hội đồng có sinh viên mình hướng dẫn.",
                    DefenseUcErrorCodes.Constraints.LecturerSupervisorConflict);
            }
        }
    }
}

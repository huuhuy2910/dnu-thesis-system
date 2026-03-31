using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;

namespace ThesisManagement.Api.Application.Common.Constraints
{
    public sealed class RoleRequirementRule : ICommitteeConstraintRule
    {
        private readonly ApplicationDbContext _db;

        public RoleRequirementRule(ApplicationDbContext db)
        {
            _db = db;
        }

        public string RuleKey => "RoleRequirement";

        public async Task ValidateAsync(CommitteeConstraintContext context, CancellationToken cancellationToken)
        {
            var roles = await _db.CommitteeMembers.AsNoTracking()
                .Where(x => x.CommitteeID == context.CommitteeId)
                .Select(x => x.Role ?? string.Empty)
                .ToListAsync(cancellationToken);

            var normalized = roles.Select(NormalizeRole).ToList();
            var chairCount = normalized.Count(x => x == "CT");
            var secretaryCount = normalized.Count(x => x == "TK");

            if (chairCount != 1 || secretaryCount != 1)
            {
                throw new BusinessRuleException("Hội đồng phải có đúng 1 Chủ tịch và 1 Thư ký.", DefenseUcErrorCodes.Constraints.InvalidRequiredRoles);
            }
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return string.Empty;
            }

            var v = role.Trim().ToUpperInvariant();
            return v switch
            {
                "CHU TICH" => "CT",
                "CHỦ TỊCH" => "CT",
                "CT" => "CT",
                "SECRETARY" => "TK",
                "THU KY" => "TK",
                "THƯ KÝ" => "TK",
                "TK" => "TK",
                _ => v
            };
        }
    }
}

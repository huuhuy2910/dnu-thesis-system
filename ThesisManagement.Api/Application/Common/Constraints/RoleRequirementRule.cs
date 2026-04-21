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
            var secretaryCount = normalized.Count(x => x == "UVTK");
            var reviewerCount = normalized.Count(x => x == "UVPB");

            if (chairCount != 1 || secretaryCount != 1 || reviewerCount < 1)
            {
                throw new BusinessRuleException(
                    "Hội đồng phải có đúng 1 Chủ tịch, đúng 1 Ủy viên thư ký và tối thiểu 1 Ủy viên phản biện.",
                    DefenseUcErrorCodes.Constraints.InvalidRequiredRoles);
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
                "UVTK" => "UVTK",
                "SECRETARY" => "UVTK",
                "THU KY" => "UVTK",
                "THƯ KÝ" => "UVTK",
                "TK" => "UVTK",
                "UY VIEN THU KY" => "UVTK",
                "ỦY VIÊN THƯ KÝ" => "UVTK",
                "UY VIEN TK" => "UVTK",
                "ỦY VIÊN TK" => "UVTK",
                "UVPB" => "UVPB",
                "PHAN BIEN" => "UVPB",
                "PHẢN BIỆN" => "UVPB",
                "REVIEWER" => "UVPB",
                "PB" => "UVPB",
                "UY VIEN PHAN BIEN" => "UVPB",
                "ỦY VIÊN PHẢN BIỆN" => "UVPB",
                "UY VIEN PB" => "UVPB",
                "ỦY VIÊN PB" => "UVPB",
                "UV" => "UV",
                _ => v
            };
        }
    }
}

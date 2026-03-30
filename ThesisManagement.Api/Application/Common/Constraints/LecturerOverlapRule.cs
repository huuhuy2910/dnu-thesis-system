using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;

namespace ThesisManagement.Api.Application.Common.Constraints
{
    public sealed class LecturerOverlapRule : ICommitteeConstraintRule
    {
        private readonly ApplicationDbContext _db;

        public LecturerOverlapRule(ApplicationDbContext db)
        {
            _db = db;
        }

        public string RuleKey => "LecturerOverlap";

        public async Task ValidateAsync(CommitteeConstraintContext context, CancellationToken cancellationToken)
        {
            if (context.Slots.Count == 0)
            {
                return;
            }

            var lecturerCodes = await _db.CommitteeMembers.AsNoTracking()
                .Where(x => x.CommitteeID == context.CommitteeId && x.MemberLecturerCode != null)
                .Select(x => x.MemberLecturerCode!)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (lecturerCodes.Count == 0)
            {
                return;
            }

            var memberCommittees = await _db.CommitteeMembers.AsNoTracking()
                .Where(x => x.CommitteeID != context.CommitteeId && x.MemberLecturerCode != null && lecturerCodes.Contains(x.MemberLecturerCode))
                .Select(x => new { x.CommitteeID, x.MemberLecturerCode })
                .ToListAsync(cancellationToken);

            if (memberCommittees.Count == 0)
            {
                return;
            }

            var otherCommitteeIds = memberCommittees
                .Where(x => x.CommitteeID.HasValue)
                .Select(x => x.CommitteeID!.Value)
                .Distinct()
                .ToList();

            var slotSet = context.Slots.Select(x => $"{x.Date:yyyyMMdd}:{x.Session}").ToHashSet(StringComparer.OrdinalIgnoreCase);

            var overlaps = await _db.DefenseAssignments.AsNoTracking()
                .Where(x => x.CommitteeID.HasValue && otherCommitteeIds.Contains(x.CommitteeID.Value) && x.ScheduledAt.HasValue && x.Session.HasValue)
                .Select(x => new { x.CommitteeID, x.ScheduledAt, x.Session })
                .ToListAsync(cancellationToken);

            var found = overlaps.FirstOrDefault(x => x.ScheduledAt.HasValue && x.Session.HasValue && slotSet.Contains($"{x.ScheduledAt.Value:yyyyMMdd}:{x.Session.Value}"));
            if (found != null)
            {
                var conflictedLecturers = memberCommittees
                    .Where(x => x.CommitteeID == found.CommitteeID)
                    .Select(x => x.MemberLecturerCode)
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList();

                throw new BusinessRuleException(
                    "Một giảng viên không thể ở 2 hội đồng cùng thời điểm.",
                    DefenseUcErrorCodes.Constraints.LecturerTimeOverlap,
                    new
                    {
                        ConflictCommitteeId = found.CommitteeID,
                        Lecturers = conflictedLecturers,
                        Slot = $"{found.ScheduledAt:yyyy-MM-dd}-S{found.Session}"
                    });
            }
        }
    }
}

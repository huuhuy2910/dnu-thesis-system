using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.DefensePeriods;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.DefensePeriods.Services
{
    public interface IDefenseRevisionWorkflowService
    {
        Task ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default);
        Task SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, string studentCode, int actorUserId, CancellationToken cancellationToken = default);
    }

    public sealed class DefenseRevisionWorkflowService : IDefenseRevisionWorkflowService
    {
        private readonly ApplicationDbContext _db;
        private readonly ThesisManagement.Api.Services.IUnitOfWork _uow;
        private readonly IDefenseAuditTrailService _auditTrail;
        private readonly DefenseRevisionQuorumOptions _quorumOptions;
        private readonly IFileStorageService _storageService;

        public DefenseRevisionWorkflowService(
            ApplicationDbContext db,
            ThesisManagement.Api.Services.IUnitOfWork uow,
            IDefenseAuditTrailService auditTrail,
            IFileStorageService storageService,
            IOptions<DefenseRevisionQuorumOptions> quorumOptions)
        {
            _db = db;
            _uow = uow;
            _auditTrail = auditTrail;
            _storageService = storageService;
            _quorumOptions = quorumOptions.Value;
        }

        public Task ApproveRevisionAsync(int revisionId, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
            => UpdateRevisionStatusAsync(revisionId, lecturerCode, actorUserId, true, null, cancellationToken);

        public Task RejectRevisionAsync(int revisionId, string reason, string lecturerCode, int actorUserId, CancellationToken cancellationToken = default)
            => UpdateRevisionStatusAsync(revisionId, lecturerCode, actorUserId, false, reason, cancellationToken);

        public async Task SubmitStudentRevisionAsync(StudentRevisionSubmissionDto request, string studentCode, int actorUserId, CancellationToken cancellationToken = default)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);

            var file = request.File;

            if (file == null || file.Length == 0)
            {
                throw new BusinessRuleException("File PDF là bắt buộc.");
            }

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessRuleException("Chỉ chấp nhận file PDF.");
            }

            var assignment = await _db.DefenseAssignments
                .Join(_db.Topics, a => a.TopicCode, t => t.TopicCode, (a, t) => new { Assignment = a, Topic = t })
                .Where(x => x.Assignment.AssignmentID == request.AssignmentId && x.Topic.ProposerStudentCode == studentCode)
                .Select(x => x.Assignment)
                .FirstOrDefaultAsync(cancellationToken);

            if (assignment == null)
            {
                throw new BusinessRuleException("Không tìm thấy assignment của sinh viên.");
            }

            string? uploadedRevisionUrl = null;
            try
            {
                var uploadResult = await _storageService.UploadAsync(file, "uploads/revisions", cancellationToken);
                if (!uploadResult.Success)
                {
                    throw new BusinessRuleException(uploadResult.ErrorMessage ?? "Không thể upload file revision.");
                }

                uploadedRevisionUrl = uploadResult.Data!;

                var revision = await _db.DefenseRevisions.FirstOrDefaultAsync(x => x.AssignmentId == request.AssignmentId, cancellationToken);
                var beforeSnapshot = revision == null ? null : new { revision.RevisedContent, revision.RevisionFileUrl, revision.FinalStatus };
                if (revision == null)
                {
                    revision = new DefenseRevision
                    {
                        AssignmentId = request.AssignmentId,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _uow.DefenseRevisions.AddAsync(revision);
                }

                revision.RevisedContent = request.RevisedContent;
                revision.RevisionFileUrl = uploadedRevisionUrl;
                revision.IsCtApproved = false;
                revision.IsGvhdApproved = false;
                revision.IsUvtkApproved = false;
                revision.FinalStatus = RevisionFinalStatus.Pending;
                revision.LastUpdated = DateTime.UtcNow;
                if (revision.Id > 0)
                {
                    _uow.DefenseRevisions.Update(revision);
                }

                await _uow.SaveChangesAsync();
                await tx.CommitAsync(cancellationToken);

                await _auditTrail.WriteAsync(
                    "STUDENT_REVISION_SUBMIT",
                    "SUCCESS",
                    beforeSnapshot,
                    new { revision.RevisedContent, revision.RevisionFileUrl, revision.FinalStatus },
                    new { request.AssignmentId, StudentCode = studentCode },
                    actorUserId,
                    cancellationToken);
            }
            catch
            {
                if (!string.IsNullOrWhiteSpace(uploadedRevisionUrl))
                {
                    await _storageService.DeleteAsync(uploadedRevisionUrl, cancellationToken);
                }

                throw;
            }
        }

        private async Task UpdateRevisionStatusAsync(int revisionId, string lecturerCode, int actorUserId, bool approved, string? reason, CancellationToken cancellationToken)
        {
            await using var tx = await _uow.BeginTransactionAsync(cancellationToken);

            var revision = await _db.DefenseRevisions.FirstOrDefaultAsync(x => x.Id == revisionId, cancellationToken);
            if (revision == null)
            {
                throw new BusinessRuleException("Không tìm thấy revision.");
            }

            var assignment = await _db.DefenseAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.AssignmentID == revision.AssignmentId, cancellationToken);
            if (assignment == null || !assignment.CommitteeID.HasValue)
            {
                throw new BusinessRuleException("Revision không thuộc hội đồng hợp lệ.");
            }

            var topic = await _db.Topics.AsNoTracking().FirstOrDefaultAsync(x => x.TopicCode == assignment.TopicCode, cancellationToken);
            if (topic == null)
            {
                throw new BusinessRuleException("Không tìm thấy đề tài của revision.");
            }

            var member = await _db.CommitteeMembers.AsNoTracking()
                .FirstOrDefaultAsync(x => x.CommitteeID == assignment.CommitteeID && x.MemberLecturerCode == lecturerCode, cancellationToken);
            var role = member != null ? NormalizeRole(member.Role) : string.Empty;
            var isSupervisor = !string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode)
                && string.Equals(topic.SupervisorLecturerCode, lecturerCode, StringComparison.OrdinalIgnoreCase);
            var canApprove = role == "CT" || role == "UVTK" || isSupervisor;
            if (!canApprove)
            {
                throw new BusinessRuleException("Giảng viên không có quyền duyệt revision này.");
            }

            if (!approved && string.IsNullOrWhiteSpace(reason))
            {
                throw new BusinessRuleException("Lý do từ chối revision là bắt buộc.", "UC4.1.REJECT_REASON_REQUIRED");
            }

            var beforeSnapshot = new
            {
                revision.IsCtApproved,
                revision.IsUvtkApproved,
                revision.IsGvhdApproved,
                revision.FinalStatus
            };

            if (role == "CT") revision.IsCtApproved = approved;
            if (role == "UVTK") revision.IsUvtkApproved = approved;
            if (isSupervisor) revision.IsGvhdApproved = approved;

            revision.FinalStatus = ResolveFinalStatus(revision, approved, _quorumOptions);
            revision.LastUpdated = DateTime.UtcNow;
            _uow.DefenseRevisions.Update(revision);

            await _uow.SaveChangesAsync();
            await tx.CommitAsync(cancellationToken);

            await _auditTrail.WriteAsync(
                approved ? "REVISION_APPROVE" : "REVISION_REJECT",
                "SUCCESS",
                beforeSnapshot,
                new
                {
                    revision.IsCtApproved,
                    revision.IsUvtkApproved,
                    revision.IsGvhdApproved,
                    revision.FinalStatus,
                    Quorum = new
                    {
                        _quorumOptions.MinimumApprovals,
                        _quorumOptions.RequireChairApproval,
                        _quorumOptions.RequireSecretaryApproval,
                        _quorumOptions.RequireSupervisorApproval,
                        _quorumOptions.RejectAsVeto
                    }
                },
                new { RevisionId = revisionId, LecturerCode = lecturerCode, Reason = reason },
                actorUserId,
                cancellationToken);
        }

        private static RevisionFinalStatus ResolveFinalStatus(DefenseRevision revision, bool approved, DefenseRevisionQuorumOptions options)
        {
            if (!approved && options.RejectAsVeto)
            {
                return RevisionFinalStatus.Rejected;
            }

            var approvalCount = 0;
            if (revision.IsCtApproved) approvalCount++;
            if (revision.IsUvtkApproved) approvalCount++;
            if (revision.IsGvhdApproved) approvalCount++;

            var requireCount = Math.Max(1, options.MinimumApprovals);
            var requiredRolesOk = (!options.RequireChairApproval || revision.IsCtApproved)
                && (!options.RequireSecretaryApproval || revision.IsUvtkApproved)
                && (!options.RequireSupervisorApproval || revision.IsGvhdApproved);

            if (requiredRolesOk && approvalCount >= requireCount)
            {
                return RevisionFinalStatus.Approved;
            }

            return RevisionFinalStatus.Pending;
        }

        private static string NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return string.Empty;
            }

            var upper = role.Trim().ToUpperInvariant();
            if (upper.Contains("GVHD")) return "GVHD";
            if (upper.Contains("CHU") || upper == "CT") return "CT";
            if (upper.Contains("UVTK") || upper.Contains("THU") || upper == "TK" || upper.Contains("SECRETARY")) return "UVTK";
            if (upper.Contains("UVPB") || upper.Contains("PHAN") || upper == "PB" || upper.Contains("REVIEWER")) return "UVPB";
            if (upper == "UV" || upper.Contains("UY VIEN") || upper == "MEMBER") return "UV";
            return upper;
        }
    }
}

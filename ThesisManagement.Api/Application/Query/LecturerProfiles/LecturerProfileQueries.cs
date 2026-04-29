using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.LecturerProfiles.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerProfiles
{
    public sealed record LecturerAvatarQueryResult(string LecturerCode, bool HasAvatar, string? ImageUrl);

    public interface IGetLecturerProfileCreateQuery
    {
        object Execute();
    }

    public interface IGetLecturerProfileUpdateQuery
    {
        Task<LecturerProfileUpdateDto?> ExecuteAsync(string code);
    }

    public interface IGetLecturerAvatarQuery
    {
        Task<LecturerAvatarQueryResult?> ExecuteAsync(string code);
    }

    public class GetLecturerProfileCreateQuery : IGetLecturerProfileCreateQuery
    {
        public object Execute() => new { UserID = 0, DepartmentID = (int?)null, CurrentGuidingCount = 0, Organization = string.Empty };
    }

    public class GetLecturerProfileUpdateQuery : IGetLecturerProfileUpdateQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly ApplicationDbContext _db;

        public GetLecturerProfileUpdateQuery(IUnitOfWork uow, ApplicationDbContext db)
        {
            _uow = uow;
            _db = db;
        }

        public async Task<LecturerProfileUpdateDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (entity == null)
                return null;

            var viewCount = await _db.LecturerDashboardView
                .Where(x => x.LecturerProfileID == entity.LecturerProfileID)
                .Select(x => (int?)x.CurrentGuidingCount)
                .FirstOrDefaultAsync();

            return new LecturerProfileUpdateDto(
                entity.DepartmentCode,
                entity.Degree,
                entity.Organization,
                entity.GuideQuota,
                entity.DefenseQuota,
                viewCount ?? entity.CurrentGuidingCount,
                entity.Gender,
                entity.DateOfBirth,
                entity.Email,
                entity.PhoneNumber,
                entity.Address,
                entity.Notes,
                entity.FullName);
        }
    }

    public class GetLecturerAvatarQuery : IGetLecturerAvatarQuery
    {
        private readonly IUnitOfWork _uow;

        public GetLecturerAvatarQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<LecturerAvatarQueryResult?> ExecuteAsync(string code)
        {
            var lecturer = await _uow.LecturerProfiles.Query().AsNoTracking().FirstOrDefaultAsync(x => x.LecturerCode == code);
            if (lecturer == null)
                return null;

            return new LecturerAvatarQueryResult(code, !string.IsNullOrEmpty(lecturer.ProfileImage), lecturer.ProfileImage);
        }
    }
}

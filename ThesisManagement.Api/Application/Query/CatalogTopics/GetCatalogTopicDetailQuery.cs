using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.CatalogTopics
{
    public interface IGetCatalogTopicDetailQuery
    {
        Task<CatalogTopicDetailReadDto?> ExecuteAsync(string code);
    }

    public class GetCatalogTopicDetailQuery : IGetCatalogTopicDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly ApplicationDbContext _db;

        public GetCatalogTopicDetailQuery(IUnitOfWork uow, ApplicationDbContext db)
        {
            _uow = uow;
            _db = db;
        }

        public async Task<CatalogTopicDetailReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.CatalogTopics.Query()
                .AsNoTracking()
                .Include(x => x.CatalogTopicTags!)
                    .ThenInclude(x => x.Tag)
                .FirstOrDefaultAsync(x => x.CatalogTopicCode == code);

            if (entity == null)
                return null;

            var catalogTags = entity.CatalogTopicTags?
                .Where(x => x.Tag != null)
                .Select(x => new CatalogTopicTagItemDto(
                    x.TagID,
                    x.TagCode ?? x.Tag!.TagCode,
                    x.Tag!.TagName))
                .GroupBy(x => x.TagID)
                .Select(x => x.First())
                .OrderBy(x => x.TagCode)
                .ToList() ?? new List<CatalogTopicTagItemDto>();

            var catalogTagIds = catalogTags.Select(x => x.TagID).ToHashSet();

            if (catalogTagIds.Count == 0)
            {
                return new CatalogTopicDetailReadDto(
                    entity.CatalogTopicID,
                    entity.CatalogTopicCode,
                    entity.Title,
                    entity.Summary,
                    entity.DepartmentCode,
                    entity.AssignedStatus,
                    entity.AssignedAt,
                    entity.CreatedAt,
                    entity.LastUpdated,
                    catalogTags,
                    new List<CatalogTopicEligibleLecturerDto>());
            }

            var matchingLecturerRows = await (
                from lecturerTag in _uow.LecturerTags.Query().AsNoTracking()
                join lecturer in _uow.LecturerProfiles.Query().AsNoTracking() on lecturerTag.LecturerProfileID equals lecturer.LecturerProfileID
                join tag in _uow.Tags.Query().AsNoTracking() on lecturerTag.TagID equals tag.TagID
                where catalogTagIds.Contains(lecturerTag.TagID)
                select new
                {
                    lecturer.LecturerProfileID,
                    lecturer.LecturerCode,
                    lecturer.UserCode,
                    lecturer.DepartmentCode,
                    lecturer.Degree,
                    lecturer.GuideQuota,
                    lecturer.DefenseQuota,
                    lecturer.FullName,
                    lecturer.Email,
                    lecturer.PhoneNumber,
                    tag.TagID,
                    tag.TagCode,
                    tag.TagName
                })
                .ToListAsync();

            var lecturerIds = matchingLecturerRows
                .Select(x => x.LecturerProfileID)
                .Distinct()
                .ToList();

            var allLecturerTagRows = await (
                from lecturerTag in _uow.LecturerTags.Query().AsNoTracking()
                join tag in _uow.Tags.Query().AsNoTracking() on lecturerTag.TagID equals tag.TagID
                where lecturerIds.Contains(lecturerTag.LecturerProfileID)
                select new
                {
                    lecturerTag.LecturerProfileID,
                    tag.TagID,
                    tag.TagCode,
                    tag.TagName
                })
                .ToListAsync();

            var guidingCounts = lecturerIds.Count == 0
                ? new Dictionary<int, int>()
                : await _db.LecturerDashboardView
                    .AsNoTracking()
                    .Where(x => lecturerIds.Contains(x.LecturerProfileID))
                    .Select(x => new { x.LecturerProfileID, x.CurrentGuidingCount })
                    .ToDictionaryAsync(x => x.LecturerProfileID, x => x.CurrentGuidingCount);

            var allTagsByLecturerId = allLecturerTagRows
                .GroupBy(x => x.LecturerProfileID)
                .ToDictionary(
                    x => x.Key,
                    x => (IReadOnlyList<CatalogTopicTagItemDto>)x
                        .OrderBy(t => t.TagCode)
                        .Select(t => new CatalogTopicTagItemDto(t.TagID, t.TagCode, t.TagName))
                        .ToList());

            var matchCountByLecturerId = matchingLecturerRows
                .GroupBy(x => x.LecturerProfileID)
                .ToDictionary(x => x.Key, x => x.Count());

            var eligibleLecturers = matchingLecturerRows
                .GroupBy(x => new
                {
                    x.LecturerProfileID,
                    x.LecturerCode,
                    x.UserCode,
                    x.DepartmentCode,
                    x.Degree,
                    x.GuideQuota,
                    x.DefenseQuota,
                    x.FullName,
                    x.Email,
                    x.PhoneNumber
                })
                .Select(group =>
                {
                    var lecturerId = group.Key.LecturerProfileID;
                    var currentGuidingCount = guidingCounts.TryGetValue(lecturerId, out var count) ? count : 0;
                    var lecturerTags = allTagsByLecturerId.TryGetValue(lecturerId, out var tags)
                        ? tags
                        : new List<CatalogTopicTagItemDto>();

                    return new CatalogTopicEligibleLecturerDto(
                        group.Key.LecturerProfileID,
                        group.Key.LecturerCode,
                        group.Key.UserCode,
                        group.Key.DepartmentCode,
                        group.Key.Degree,
                        group.Key.GuideQuota ?? 0,
                        group.Key.DefenseQuota ?? 0,
                        currentGuidingCount,
                        group.Key.FullName,
                        group.Key.Email,
                        group.Key.PhoneNumber,
                        lecturerTags);
                })
                    .OrderByDescending(x => matchCountByLecturerId.TryGetValue(x.LecturerProfileID, out var matchCount) ? matchCount : 0)
                .ThenBy(x => x.CurrentGuidingCount)
                .ThenBy(x => x.LecturerCode)
                .ToList();

            return new CatalogTopicDetailReadDto(
                entity.CatalogTopicID,
                entity.CatalogTopicCode,
                entity.Title,
                entity.Summary,
                entity.DepartmentCode,
                entity.AssignedStatus,
                entity.AssignedAt,
                entity.CreatedAt,
                entity.LastUpdated,
                catalogTags,
                eligibleLecturers);
        }
    }
}

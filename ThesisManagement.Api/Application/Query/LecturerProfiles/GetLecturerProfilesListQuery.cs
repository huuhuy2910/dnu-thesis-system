using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.LecturerProfiles.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerProfiles
{
    public interface IGetLecturerProfilesListQuery
    {
        Task<(IEnumerable<LecturerProfileReadDto> Items, int TotalCount)> ExecuteAsync(LecturerProfileFilter filter);
    }

    public class GetLecturerProfilesListQuery : IGetLecturerProfilesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerProfilesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<LecturerProfileReadDto> Items, int TotalCount)> ExecuteAsync(LecturerProfileFilter filter)
        {
            var tagCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (filter.TagCodes != null)
            {
                foreach (var code in filter.TagCodes)
                {
                    if (!string.IsNullOrWhiteSpace(code))
                    {
                        var values = code.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var value in values)
                        {
                            var normalized = value.Trim();
                            if (!string.IsNullOrWhiteSpace(normalized))
                            {
                                tagCodes.Add(normalized);
                            }
                        }
                    }
                }
            }

            if (!string.IsNullOrEmpty(filter.Tags))
            {
                var tagValues = filter.Tags.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var tag in tagValues)
                {
                    var value = tag.Trim();
                    if (!string.IsNullOrWhiteSpace(value))
                        tagCodes.Add(value);
                }
            }

            IEnumerable<LecturerProfile> items;
            int totalCount;

            if (tagCodes.Count > 0)
            {
                var normalizedTagCodes = tagCodes
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x.Trim().ToUpperInvariant())
                    .ToHashSet();

                var filteredLecturers = await _uow.LecturerProfiles.Query()
                    .Where(lp => _uow.LecturerTags.Query()
                        .Any(lt =>
                            (lt.LecturerProfileID == lp.LecturerProfileID || lt.LecturerCode == lp.LecturerCode) &&
                            (
                                (lt.TagCode != null && normalizedTagCodes.Contains(lt.TagCode.ToUpper())) ||
                                (lt.Tag != null && lt.Tag.TagCode != null && normalizedTagCodes.Contains(lt.Tag.TagCode.ToUpper()))
                            )))
                    .ToListAsync();

                var tempFilter = new LecturerProfileFilter
                {
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    Search = filter.Search,
                    UserCode = filter.UserCode,
                    DepartmentCode = filter.DepartmentCode,
                    LecturerCode = filter.LecturerCode,
                    Degree = filter.Degree,
                    MinGuideQuota = filter.MinGuideQuota,
                    MaxGuideQuota = filter.MaxGuideQuota,
                    MinDefenseQuota = filter.MinDefenseQuota,
                    MaxDefenseQuota = filter.MaxDefenseQuota,
                    TagCodes = null,
                    Tags = null,
                    FromDate = filter.FromDate,
                    ToDate = filter.ToDate,
                    SortBy = filter.SortBy
                };

                var lecturerIds = filteredLecturers.Select(fl => fl.LecturerProfileID).ToList();
                var result = await _uow.LecturerProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, tempFilter,
                    (query, f) => query.Where(lp => lecturerIds.Contains(lp.LecturerProfileID)).ApplyFilter(f));

                items = result.Items;
                totalCount = result.TotalCount;
            }
            else
            {
                var result = await _uow.LecturerProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                    (query, f) => query.ApplyFilter(f));

                items = result.Items;
                totalCount = result.TotalCount;
            }

            return (items.Select(x => _mapper.Map<LecturerProfileReadDto>(x)), totalCount);
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.TopicRenameRequests;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Command;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.TopicRenameRequests;

namespace ThesisManagement.Api.Application.Query.TopicRenameRequests
{
    public interface IGetTopicRenameRequestsListQuery
    {
        Task<(IEnumerable<TopicRenameRequestReadDto> Items, int TotalCount)> ExecuteAsync(TopicRenameRequestFilter filter);
    }

    public interface IGetTopicRenameRequestDetailQuery
    {
        Task<TopicRenameRequestDetailDto?> ExecuteAsync(int id);
    }

    public interface IGetTopicRenameRequestCreateQuery
    {
        TopicRenameRequestCreateDto Execute();
    }

    public interface IGetTopicRenameRequestUpdateQuery
    {
        Task<TopicRenameRequestUpdateDto?> ExecuteAsync(int id);
    }

    public class GetTopicRenameRequestsListQuery : IGetTopicRenameRequestsListQuery
    {
        private readonly IUnitOfWork _uow;

        public GetTopicRenameRequestsListQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<(IEnumerable<TopicRenameRequestReadDto> Items, int TotalCount)> ExecuteAsync(TopicRenameRequestFilter filter)
        {
            var requestQuery = _uow.TopicRenameRequests.Query();

            if (filter.TopicID.HasValue)
                requestQuery = requestQuery.Where(x => x.TopicId == filter.TopicID.Value);
            if (!string.IsNullOrWhiteSpace(filter.TopicCode))
                requestQuery = requestQuery.Where(x => x.TopicCode == filter.TopicCode);
            if (!string.IsNullOrWhiteSpace(filter.Status))
                requestQuery = requestQuery.Where(x => x.Status == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.RequestedByUserCode))
                requestQuery = requestQuery.Where(x => x.RequestedByUserCode == filter.RequestedByUserCode);
            if (!string.IsNullOrWhiteSpace(filter.ReviewedByUserCode))
                requestQuery = requestQuery.Where(x => x.ReviewedByUserCode == filter.ReviewedByUserCode);
            if (!string.IsNullOrWhiteSpace(filter.OldTitle))
                requestQuery = requestQuery.Where(x => x.OldTitle.Contains(filter.OldTitle));
            if (!string.IsNullOrWhiteSpace(filter.NewTitle))
                requestQuery = requestQuery.Where(x => x.NewTitle.Contains(filter.NewTitle));

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var keyword = filter.Search.Trim();
                requestQuery = requestQuery.Where(x =>
                    x.RequestCode.Contains(keyword) ||
                    x.TopicCode.Contains(keyword) ||
                    x.OldTitle.Contains(keyword) ||
                    x.NewTitle.Contains(keyword) ||
                    (x.Reason ?? string.Empty).Contains(keyword) ||
                    (x.RequestedByUserCode ?? string.Empty).Contains(keyword) ||
                    (x.ReviewedByUserCode ?? string.Empty).Contains(keyword));
            }

            if (filter.FromDate.HasValue)
                requestQuery = requestQuery.Where(x => x.RequestedAt >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                requestQuery = requestQuery.Where(x => x.RequestedAt <= filter.ToDate.Value);

            requestQuery = requestQuery.OrderByDescending(x => x.RequestedAt).ThenByDescending(x => x.RequestId);
            var totalCount = await requestQuery.CountAsync();

            var pagedRequests = requestQuery
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize);

            var items = await (
                from request in pagedRequests
                join requestedStudent in _uow.StudentProfiles.Query()
                    on request.RequestedByUserCode equals requestedStudent.UserCode into requestedStudentGroup
                from requestedStudent in requestedStudentGroup.DefaultIfEmpty()
                join reviewedLecturer in _uow.LecturerProfiles.Query()
                    on request.ReviewedByUserCode equals reviewedLecturer.UserCode into reviewedLecturerGroup
                from reviewedLecturer in reviewedLecturerGroup.DefaultIfEmpty()
                select new TopicRenameRequestReadDto(
                    request.RequestId,
                    request.RequestCode,
                    request.TopicId,
                    request.TopicCode,
                    request.OldTitle,
                    request.NewTitle,
                    request.Reason,
                    request.Status,
                    request.RequestedByUserCode,
                    request.RequestedByRole,
                    request.ReviewedByUserCode,
                    request.ReviewedByRole,
                    request.ReviewComment,
                    request.RequestedAt,
                    request.ReviewedAt,
                    request.AppliedAt,
                    request.GeneratedFileUrl,
                    request.GeneratedFileName,
                    request.GeneratedFileSize,
                    request.GeneratedFileHash,
                    request.CreatedAt,
                    request.LastUpdated,
                    requestedStudent != null ? requestedStudent.FullName : request.RequestedByUserCode,
                    reviewedLecturer != null ? reviewedLecturer.FullName : request.ReviewedByUserCode,
                    requestedStudent != null ? requestedStudent.StudentCode : request.RequestedByUserCode,
                    reviewedLecturer != null ? reviewedLecturer.LecturerCode : request.ReviewedByUserCode))
                .ToListAsync();

            return (items, totalCount);
        }
    }

    public class GetTopicRenameRequestDetailQuery : IGetTopicRenameRequestDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ITopicRenameRequestContextService _contextService;

        public GetTopicRenameRequestDetailQuery(IUnitOfWork uow, IMapper mapper, ITopicRenameRequestContextService contextService)
        {
            _uow = uow;
            _mapper = mapper;
            _contextService = contextService;
        }

        public async Task<TopicRenameRequestDetailDto?> ExecuteAsync(int id)
        {
            var request = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (request == null)
                return null;

            var templateData = await _contextService.BuildTemplateDataAsync(request);

            var files = await _uow.TopicRenameRequestFiles.Query()
                .Where(x => x.RequestId == id)
                .OrderByDescending(x => x.IsCurrent)
                .ThenByDescending(x => x.CreatedAt)
                .ToListAsync();

            var history = await _uow.TopicTitleHistories.Query()
                .Where(x => x.RequestId == id)
                .OrderByDescending(x => x.EffectiveAt)
                .ThenByDescending(x => x.HistoryId)
                .ToListAsync();

            return new TopicRenameRequestDetailDto(
                _mapper.Map<TopicRenameRequestReadDto>(request),
                templateData,
                files.Select(x => _mapper.Map<TopicRenameRequestFileReadDto>(x)),
                history.Select(x => _mapper.Map<TopicTitleHistoryReadDto>(x)));
        }
    }

    public class GetTopicRenameRequestCreateQuery : IGetTopicRenameRequestCreateQuery
    {
        public TopicRenameRequestCreateDto Execute()
            => new(0, null, string.Empty, null);
    }

    public class GetTopicRenameRequestUpdateQuery : IGetTopicRenameRequestUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetTopicRenameRequestUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<TopicRenameRequestUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new TopicRenameRequestUpdateDto(entity.NewTitle, entity.Reason);
        }
    }
}
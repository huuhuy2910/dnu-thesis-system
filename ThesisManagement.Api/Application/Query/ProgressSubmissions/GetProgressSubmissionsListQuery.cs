using AutoMapper;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ProgressSubmissions
{
    public interface IGetProgressSubmissionsListQuery
    {
        Task<(IEnumerable<ProgressSubmissionReadDto> Items, int TotalCount)> ExecuteAsync(ProgressSubmissionFilter filter);
    }

    public class GetProgressSubmissionsListQuery : IGetProgressSubmissionsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetProgressSubmissionsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<ProgressSubmissionReadDto> Items, int TotalCount)> ExecuteAsync(ProgressSubmissionFilter filter)
        {
            var result = await _uow.ProgressSubmissions.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<ProgressSubmissionReadDto>(x)), result.TotalCount);
        }
    }
}

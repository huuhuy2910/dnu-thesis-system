using AutoMapper;
using ThesisManagement.Api.DTOs.ProgressMilestones.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ProgressMilestones
{
    public interface IGetProgressMilestonesListQuery
    {
        Task<(IEnumerable<ProgressMilestoneReadDto> Items, int TotalCount)> ExecuteAsync(ProgressMilestoneFilter filter);
    }

    public class GetProgressMilestonesListQuery : IGetProgressMilestonesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetProgressMilestonesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<ProgressMilestoneReadDto> Items, int TotalCount)> ExecuteAsync(ProgressMilestoneFilter filter)
        {
            var result = await _uow.ProgressMilestones.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            return (result.Items.Select(x => _mapper.Map<ProgressMilestoneReadDto>(x)), result.TotalCount);
        }
    }
}

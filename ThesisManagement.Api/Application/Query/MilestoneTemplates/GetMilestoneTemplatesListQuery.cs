using AutoMapper;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MilestoneTemplates
{
    public interface IGetMilestoneTemplatesListQuery
    {
        Task<(IEnumerable<MilestoneTemplateReadDto> Items, int TotalCount)> ExecuteAsync(MilestoneTemplateFilter filter);
    }

    public class GetMilestoneTemplatesListQuery : IGetMilestoneTemplatesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMilestoneTemplatesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<MilestoneTemplateReadDto> Items, int TotalCount)> ExecuteAsync(MilestoneTemplateFilter filter)
        {
            var result = await _uow.MilestoneTemplates.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<MilestoneTemplateReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}

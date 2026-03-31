using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseTerms.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTerms
{
    public interface IGetDefenseTermsListQuery
    {
        Task<(IEnumerable<DefenseTermReadDto> Items, int TotalCount)> ExecuteAsync(DefenseTermFilter filter);
    }

    public class GetDefenseTermsListQuery : IGetDefenseTermsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseTermsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<DefenseTermReadDto> Items, int TotalCount)> ExecuteAsync(DefenseTermFilter filter)
        {
            var result = await _uow.DefenseTerms.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<DefenseTermReadDto>(x)), result.TotalCount);
        }
    }
}
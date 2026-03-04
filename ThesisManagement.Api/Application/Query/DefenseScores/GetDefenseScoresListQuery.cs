using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseScores.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseScores
{
    public interface IGetDefenseScoresListQuery
    {
        Task<(IEnumerable<DefenseScoreReadDto> Items, int TotalCount)> ExecuteAsync(DefenseScoreFilter filter);
    }

    public class GetDefenseScoresListQuery : IGetDefenseScoresListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseScoresListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<DefenseScoreReadDto> Items, int TotalCount)> ExecuteAsync(DefenseScoreFilter filter)
        {
            var result = await _uow.DefenseScores.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<DefenseScoreReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}

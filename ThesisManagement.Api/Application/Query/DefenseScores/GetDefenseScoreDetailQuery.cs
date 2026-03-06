using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseScores.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseScores
{
    public interface IGetDefenseScoreDetailQuery
    {
        Task<DefenseScoreReadDto?> ExecuteAsync(string code);
    }

    public class GetDefenseScoreDetailQuery : IGetDefenseScoreDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseScoreDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<DefenseScoreReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.DefenseScores.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<DefenseScoreReadDto>(entity);
        }
    }
}

using ThesisManagement.Api.DTOs.DefenseScores.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseScores
{
    public interface IGetDefenseScoreUpdateQuery
    {
        Task<DefenseScoreUpdateDto?> ExecuteAsync(int id);
    }

    public class GetDefenseScoreUpdateQuery : IGetDefenseScoreUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetDefenseScoreUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<DefenseScoreUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.DefenseScores.GetByIdAsync(id);
            return entity == null ? null : new DefenseScoreUpdateDto(entity.Score, entity.Comment);
        }
    }
}

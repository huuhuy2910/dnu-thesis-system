using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseScores
{
    public interface IDeleteDefenseScoreCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteDefenseScoreCommand : IDeleteDefenseScoreCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteDefenseScoreCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.DefenseScores.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Score not found", 404);

            _uow.DefenseScores.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

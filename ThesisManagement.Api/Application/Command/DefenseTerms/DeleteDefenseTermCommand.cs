using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTerms
{
    public interface IDeleteDefenseTermCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class DeleteDefenseTermCommand : IDeleteDefenseTermCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteDefenseTermCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.DefenseTerms.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("DefenseTerm not found", 404);

            _uow.DefenseTerms.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}
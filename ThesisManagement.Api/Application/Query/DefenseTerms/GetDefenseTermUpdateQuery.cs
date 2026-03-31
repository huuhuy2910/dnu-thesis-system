using ThesisManagement.Api.DTOs.DefenseTerms.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTerms
{
    public interface IGetDefenseTermUpdateQuery
    {
        Task<DefenseTermUpdateDto?> ExecuteAsync(int id);
    }

    public class GetDefenseTermUpdateQuery : IGetDefenseTermUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetDefenseTermUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<DefenseTermUpdateDto?> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTerms.GetByIdAsync(id);
            if (item == null) return null;

            return new DefenseTermUpdateDto(
                item.Name,
                item.StartDate,
                item.ConfigJson,
                item.Status,
                item.CreatedAt,
                item.LastUpdated);
        }
    }
}
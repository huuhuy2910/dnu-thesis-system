using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MilestoneTemplates
{
    public interface IGetMilestoneTemplateUpdateQuery
    {
        Task<MilestoneTemplateUpdateDto?> ExecuteAsync(int id);
    }

    public class GetMilestoneTemplateUpdateQuery : IGetMilestoneTemplateUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetMilestoneTemplateUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<MilestoneTemplateUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MilestoneTemplates.GetByIdAsync(id);
            return entity == null ? null : new MilestoneTemplateUpdateDto(entity.Name, entity.Description, entity.Ordinal, entity.Deadline);
        }
    }
}

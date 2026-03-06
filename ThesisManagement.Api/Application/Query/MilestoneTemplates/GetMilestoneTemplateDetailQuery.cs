using AutoMapper;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MilestoneTemplates
{
    public interface IGetMilestoneTemplateDetailQuery
    {
        Task<MilestoneTemplateReadDto?> ExecuteAsync(string code);
    }

    public class GetMilestoneTemplateDetailQuery : IGetMilestoneTemplateDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMilestoneTemplateDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<MilestoneTemplateReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.MilestoneTemplates.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<MilestoneTemplateReadDto>(entity);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.DTOs.ProgressMilestones.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ProgressMilestones
{
    public interface IGetProgressMilestoneDetailQuery
    {
        Task<ProgressMilestoneReadDto?> ExecuteAsync(string code);
    }

    public class GetProgressMilestoneDetailQuery : IGetProgressMilestoneDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetProgressMilestoneDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<ProgressMilestoneReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.ProgressMilestones.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<ProgressMilestoneReadDto>(entity);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseTerms.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTerms
{
    public interface IGetDefenseTermDetailQuery
    {
        Task<DefenseTermReadDto?> ExecuteAsync(int id);
    }

    public class GetDefenseTermDetailQuery : IGetDefenseTermDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseTermDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<DefenseTermReadDto?> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTerms.GetByIdAsync(id);
            return item == null ? null : _mapper.Map<DefenseTermReadDto>(item);
        }
    }
}
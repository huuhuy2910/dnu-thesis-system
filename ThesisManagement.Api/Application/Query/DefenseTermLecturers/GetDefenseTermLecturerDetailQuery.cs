using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseTermLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTermLecturers
{
    public interface IGetDefenseTermLecturerDetailQuery
    {
        Task<DefenseTermLecturerReadDto?> ExecuteAsync(int id);
    }

    public class GetDefenseTermLecturerDetailQuery : IGetDefenseTermLecturerDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseTermLecturerDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<DefenseTermLecturerReadDto?> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTermLecturers.GetByIdAsync(id);
            return item == null ? null : _mapper.Map<DefenseTermLecturerReadDto>(item);
        }
    }
}
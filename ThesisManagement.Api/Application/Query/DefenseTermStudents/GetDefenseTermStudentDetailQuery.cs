using AutoMapper;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.DefenseTermStudents
{
    public interface IGetDefenseTermStudentDetailQuery
    {
        Task<DefenseTermStudentReadDto?> ExecuteAsync(int id);
    }

    public class GetDefenseTermStudentDetailQuery : IGetDefenseTermStudentDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDefenseTermStudentDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<DefenseTermStudentReadDto?> ExecuteAsync(int id)
        {
            var item = await _uow.DefenseTermStudents.GetByIdAsync(id);
            return item == null ? null : _mapper.Map<DefenseTermStudentReadDto>(item);
        }
    }
}
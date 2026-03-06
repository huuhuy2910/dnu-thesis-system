using AutoMapper;
using ThesisManagement.Api.DTOs.StudentProfiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.StudentProfiles
{
    public interface IGetStudentProfileDetailQuery
    {
        Task<StudentProfileReadDto?> ExecuteAsync(string code);
    }

    public class GetStudentProfileDetailQuery : IGetStudentProfileDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetStudentProfileDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<StudentProfileReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.StudentProfiles.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<StudentProfileReadDto>(entity);
        }
    }
}

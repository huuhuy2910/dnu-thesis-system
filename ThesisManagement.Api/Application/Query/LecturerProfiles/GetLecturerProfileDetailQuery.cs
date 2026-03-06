using AutoMapper;
using ThesisManagement.Api.DTOs.LecturerProfiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerProfiles
{
    public interface IGetLecturerProfileDetailQuery
    {
        Task<LecturerProfileReadDto?> ExecuteAsync(string code);
    }

    public class GetLecturerProfileDetailQuery : IGetLecturerProfileDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerProfileDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<LecturerProfileReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<LecturerProfileReadDto>(entity);
        }
    }
}

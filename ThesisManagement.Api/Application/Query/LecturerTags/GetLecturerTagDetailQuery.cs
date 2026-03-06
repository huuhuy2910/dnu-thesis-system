using AutoMapper;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagDetailQuery
    {
        Task<LecturerTagReadDto?> ExecuteAsync(int id);
    }

    public class GetLecturerTagDetailQuery : IGetLecturerTagDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerTagDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<LecturerTagReadDto?> ExecuteAsync(int id)
        {
            var item = await _uow.LecturerTags.GetByIdAsync(id);
            return item == null ? null : _mapper.Map<LecturerTagReadDto>(item);
        }
    }
}

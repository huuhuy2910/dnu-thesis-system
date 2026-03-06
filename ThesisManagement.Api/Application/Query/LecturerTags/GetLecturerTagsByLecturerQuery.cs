using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagsByLecturerQuery
    {
        Task<List<LecturerTagReadDto>> ExecuteAsync(string lecturerCode);
    }

    public class GetLecturerTagsByLecturerQuery : IGetLecturerTagsByLecturerQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerTagsByLecturerQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<List<LecturerTagReadDto>> ExecuteAsync(string lecturerCode)
        {
            var items = await _uow.LecturerTags.Query()
                .Where(x => x.LecturerCode == lecturerCode)
                .Include(x => x.Tag)
                .Include(x => x.AssignedByUser)
                .ToListAsync();
            return _mapper.Map<List<LecturerTagReadDto>>(items);
        }
    }
}

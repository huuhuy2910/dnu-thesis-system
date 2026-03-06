using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagsByTagQuery
    {
        Task<List<LecturerTagReadDto>> ExecuteAsync(int tagId);
    }

    public class GetLecturerTagsByTagQuery : IGetLecturerTagsByTagQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerTagsByTagQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<List<LecturerTagReadDto>> ExecuteAsync(int tagId)
        {
            var items = await _uow.LecturerTags.Query()
                .Where(x => x.TagID == tagId)
                .Include(x => x.LecturerProfile)
                .Include(x => x.AssignedByUser)
                .ToListAsync();
            return _mapper.Map<List<LecturerTagReadDto>>(items);
        }
    }
}

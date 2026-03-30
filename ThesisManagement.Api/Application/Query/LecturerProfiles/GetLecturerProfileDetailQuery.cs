using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;
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
        private readonly ApplicationDbContext _db;

        public GetLecturerProfileDetailQuery(IUnitOfWork uow, IMapper mapper, ApplicationDbContext db)
        {
            _uow = uow;
            _mapper = mapper;
            _db = db;
        }

        public async Task<LecturerProfileReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (entity == null)
                return null;

            var dto = _mapper.Map<LecturerProfileReadDto>(entity);
            var viewCount = await _db.LecturerDashboardView
                .Where(x => x.LecturerProfileID == entity.LecturerProfileID)
                .Select(x => (int?)x.CurrentGuidingCount)
                .FirstOrDefaultAsync();

            return viewCount.HasValue ? dto with { CurrentGuidingCount = viewCount.Value } : dto;
        }
    }
}

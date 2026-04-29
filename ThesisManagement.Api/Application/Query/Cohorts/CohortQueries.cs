using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Cohorts.Command;
using ThesisManagement.Api.DTOs.Cohorts.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Cohorts
{
    public interface IGetCohortsListQuery
    {
        Task<(IEnumerable<CohortReadDto> Items, int TotalCount)> ExecuteAsync(CohortFilter filter);
    }

    public interface IGetCohortDetailQuery
    {
        Task<CohortReadDto?> ExecuteAsync(string code);
    }

    public interface IGetCohortCreateQuery
    {
        object Execute();
    }

    public interface IGetCohortUpdateQuery
    {
        Task<CohortUpdateDto?> ExecuteAsync(int id);
    }

    public class GetCohortsListQuery : IGetCohortsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCohortsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<CohortReadDto> Items, int TotalCount)> ExecuteAsync(CohortFilter filter)
        {
            var result = await _uow.Cohorts.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<CohortReadDto>(x));
            return (items, result.TotalCount);
        }
    }

    public class GetCohortDetailQuery : IGetCohortDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetCohortDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<CohortReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.Cohorts.Query().FirstOrDefaultAsync(x => x.CohortCode == code);
            return entity == null ? null : _mapper.Map<CohortReadDto>(entity);
        }
    }

    public class GetCohortCreateQuery : IGetCohortCreateQuery
    {
        public object Execute() => new { CohortName = string.Empty, StartYear = DateTime.UtcNow.Year, EndYear = DateTime.UtcNow.Year + 4, Status = 1 };
    }

    public class GetCohortUpdateQuery : IGetCohortUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetCohortUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<CohortUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Cohorts.GetByIdAsync(id);
            return entity == null ? null : new CohortUpdateDto(entity.CohortName, entity.StartYear, entity.EndYear, entity.Status);
        }
    }
}
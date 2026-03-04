using AutoMapper;
using ThesisManagement.Api.DTOs.Departments.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Departments
{
    public interface IGetDepartmentsListQuery
    {
        Task<(IEnumerable<DepartmentReadDto> Items, int TotalCount)> ExecuteAsync(DepartmentFilter filter);
    }

    public class GetDepartmentsListQuery : IGetDepartmentsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDepartmentsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<DepartmentReadDto> Items, int TotalCount)> ExecuteAsync(DepartmentFilter filter)
        {
            var result = await _uow.Departments.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            var items = result.Items.Select(x => _mapper.Map<DepartmentReadDto>(x));
            return (items, result.TotalCount);
        }
    }
}

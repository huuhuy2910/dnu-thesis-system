using AutoMapper;
using ThesisManagement.Api.DTOs.Departments.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Departments
{
    public interface IGetDepartmentDetailQuery
    {
        Task<DepartmentReadDto?> ExecuteAsync(string code);
    }

    public class GetDepartmentDetailQuery : IGetDepartmentDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetDepartmentDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<DepartmentReadDto?> ExecuteAsync(string code)
        {
            var item = await _uow.Departments.GetByCodeAsync(code);
            return item == null ? null : _mapper.Map<DepartmentReadDto>(item);
        }
    }
}

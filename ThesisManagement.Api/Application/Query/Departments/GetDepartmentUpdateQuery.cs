using ThesisManagement.Api.DTOs.Departments.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Departments
{
    public interface IGetDepartmentUpdateQuery
    {
        Task<DepartmentUpdateDto?> ExecuteAsync(int id);
    }

    public class GetDepartmentUpdateQuery : IGetDepartmentUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetDepartmentUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<DepartmentUpdateDto?> ExecuteAsync(int id)
        {
            var item = await _uow.Departments.GetByIdAsync(id);
            return item == null ? null : new DepartmentUpdateDto(item.Name, item.Description);
        }
    }
}

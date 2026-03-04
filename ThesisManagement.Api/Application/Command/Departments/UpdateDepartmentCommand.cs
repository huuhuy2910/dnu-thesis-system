using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Departments;
using ThesisManagement.Api.DTOs.Departments.Command;
using ThesisManagement.Api.DTOs.Departments.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Departments
{
    public interface IUpdateDepartmentCommand
    {
        Task<OperationResult<DepartmentReadDto>> ExecuteAsync(int id, DepartmentUpdateDto dto);
    }

    public class UpdateDepartmentCommand : IUpdateDepartmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateDepartmentCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DepartmentReadDto>> ExecuteAsync(int id, DepartmentUpdateDto dto)
        {
            var validationError = DepartmentCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DepartmentReadDto>.Failed(validationError, 400);

            var entity = await _uow.Departments.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<DepartmentReadDto>.Failed("Department not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Name))
                entity.Name = dto.Name.Trim();
            entity.Description = dto.Description;
            entity.LastUpdated = DateTime.UtcNow;

            _uow.Departments.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DepartmentReadDto>.Succeeded(_mapper.Map<DepartmentReadDto>(entity));
        }
    }
}

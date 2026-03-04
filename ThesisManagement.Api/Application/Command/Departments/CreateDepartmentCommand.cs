using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Departments;
using ThesisManagement.Api.DTOs.Departments.Command;
using ThesisManagement.Api.DTOs.Departments.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Departments
{
    public interface ICreateDepartmentCommand
    {
        Task<OperationResult<DepartmentReadDto>> ExecuteAsync(DepartmentCreateDto dto);
    }

    public class CreateDepartmentCommand : ICreateDepartmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateDepartmentCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<DepartmentReadDto>> ExecuteAsync(DepartmentCreateDto dto)
        {
            var validationError = DepartmentCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DepartmentReadDto>.Failed(validationError, 400);

            var entity = new Department
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                DepartmentCode = _codeGenerator.Generate("DEP"),
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Departments.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DepartmentReadDto>.Succeeded(_mapper.Map<DepartmentReadDto>(entity), 201);
        }
    }
}

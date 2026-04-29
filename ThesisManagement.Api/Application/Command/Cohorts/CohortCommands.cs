using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.Cohorts;
using ThesisManagement.Api.DTOs.Cohorts.Command;
using ThesisManagement.Api.DTOs.Cohorts.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Cohorts
{
    public interface ICreateCohortCommand
    {
        Task<OperationResult<CohortReadDto>> ExecuteAsync(CohortCreateDto dto);
    }

    public interface IUpdateCohortCommand
    {
        Task<OperationResult<CohortReadDto>> ExecuteAsync(int id, CohortUpdateDto dto);
    }

    public interface IDeleteCohortCommand
    {
        Task<OperationResult<object>> ExecuteAsync(int id);
    }

    public class CreateCohortCommand : ICreateCohortCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateCohortCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<CohortReadDto>> ExecuteAsync(CohortCreateDto dto)
        {
            var validationError = CohortCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CohortReadDto>.Failed(validationError, 400);

            var entity = new Cohort
            {
                CohortCode = _codeGenerator.Generate("COH"),
                CohortName = dto.CohortName.Trim(),
                StartYear = dto.StartYear,
                EndYear = dto.EndYear,
                Status = dto.Status ?? 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _uow.Cohorts.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<CohortReadDto>.Succeeded(_mapper.Map<CohortReadDto>(entity), 201);
        }
    }

    public class UpdateCohortCommand : IUpdateCohortCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateCohortCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<CohortReadDto>> ExecuteAsync(int id, CohortUpdateDto dto)
        {
            var validationError = CohortCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CohortReadDto>.Failed(validationError, 400);

            var entity = await _uow.Cohorts.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<CohortReadDto>.Failed("Cohort not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.CohortName))
                entity.CohortName = dto.CohortName.Trim();
            if (dto.StartYear.HasValue)
                entity.StartYear = dto.StartYear.Value;
            if (dto.EndYear.HasValue)
                entity.EndYear = dto.EndYear.Value;
            if (dto.Status.HasValue)
                entity.Status = dto.Status.Value;

            entity.UpdatedAt = DateTime.UtcNow;

            _uow.Cohorts.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<CohortReadDto>.Succeeded(_mapper.Map<CohortReadDto>(entity));
        }
    }

    public class DeleteCohortCommand : IDeleteCohortCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteCohortCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object>> ExecuteAsync(int id)
        {
            var entity = await _uow.Cohorts.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object>.Failed("Cohort not found", 404);

            _uow.Cohorts.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object>.Succeeded(null);
        }
    }
}
using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.DefenseTerms;
using ThesisManagement.Api.DTOs.DefenseTerms.Command;
using ThesisManagement.Api.DTOs.DefenseTerms.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTerms
{
    public interface ICreateDefenseTermCommand
    {
        Task<OperationResult<DefenseTermReadDto>> ExecuteAsync(DefenseTermCreateDto dto);
    }

    public class CreateDefenseTermCommand : ICreateDefenseTermCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateDefenseTermCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseTermReadDto>> ExecuteAsync(DefenseTermCreateDto dto)
        {
            var validationError = DefenseTermCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DefenseTermReadDto>.Failed(validationError, 400);

            var entity = new DefenseTerm
            {
                Name = dto.Name.Trim(),
                StartDate = dto.StartDate,
                ConfigJson = dto.ConfigJson,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Draft" : dto.Status.Trim(),
                CreatedAt = dto.CreatedAt ?? DateTime.UtcNow,
                LastUpdated = dto.LastUpdated ?? DateTime.UtcNow
            };

            await _uow.DefenseTerms.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DefenseTermReadDto>.Succeeded(_mapper.Map<DefenseTermReadDto>(entity), 201);
        }
    }
}
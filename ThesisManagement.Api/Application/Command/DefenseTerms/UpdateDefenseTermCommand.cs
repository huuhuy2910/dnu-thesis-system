using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.DefenseTerms;
using ThesisManagement.Api.DTOs.DefenseTerms.Command;
using ThesisManagement.Api.DTOs.DefenseTerms.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTerms
{
    public interface IUpdateDefenseTermCommand
    {
        Task<OperationResult<DefenseTermReadDto>> ExecuteAsync(int id, DefenseTermUpdateDto dto);
    }

    public class UpdateDefenseTermCommand : IUpdateDefenseTermCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateDefenseTermCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseTermReadDto>> ExecuteAsync(int id, DefenseTermUpdateDto dto)
        {
            var validationError = DefenseTermCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DefenseTermReadDto>.Failed(validationError, 400);

            var entity = await _uow.DefenseTerms.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<DefenseTermReadDto>.Failed("DefenseTerm not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Name))
                entity.Name = dto.Name.Trim();

            if (dto.StartDate.HasValue)
                entity.StartDate = dto.StartDate.Value;

            if (dto.ConfigJson is not null)
                entity.ConfigJson = dto.ConfigJson;

            if (dto.Status is not null)
                entity.Status = dto.Status.Trim();

            if (dto.CreatedAt.HasValue)
                entity.CreatedAt = dto.CreatedAt.Value;

            entity.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;

            _uow.DefenseTerms.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DefenseTermReadDto>.Succeeded(_mapper.Map<DefenseTermReadDto>(entity));
        }
    }
}
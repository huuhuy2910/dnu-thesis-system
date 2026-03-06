using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.MilestoneTemplates;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.MilestoneTemplates
{
    public interface IUpdateMilestoneTemplateCommand
    {
        Task<OperationResult<MilestoneTemplateReadDto>> ExecuteAsync(int id, MilestoneTemplateUpdateDto dto);
    }

    public class UpdateMilestoneTemplateCommand : IUpdateMilestoneTemplateCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateMilestoneTemplateCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<MilestoneTemplateReadDto>> ExecuteAsync(int id, MilestoneTemplateUpdateDto dto)
        {
            var validationError = MilestoneTemplateCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<MilestoneTemplateReadDto>.Failed(validationError, 400);

            var entity = await _uow.MilestoneTemplates.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<MilestoneTemplateReadDto>.Failed("Milestone template not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Name))
                entity.Name = dto.Name.Trim();

            if (dto.Description != null)
                entity.Description = dto.Description;

            if (dto.Ordinal.HasValue)
                entity.Ordinal = dto.Ordinal.Value;

            entity.LastUpdated = DateTime.UtcNow;

            _uow.MilestoneTemplates.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<MilestoneTemplateReadDto>.Succeeded(_mapper.Map<MilestoneTemplateReadDto>(entity));
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.ProgressMilestones.Command;
using ThesisManagement.Api.DTOs.ProgressMilestones.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressMilestones
{
    public interface IUpdateProgressMilestoneCommand
    {
        Task<OperationResult<ProgressMilestoneReadDto>> ExecuteAsync(int topicId, ProgressMilestoneUpdateDto dto);
    }

    public class UpdateProgressMilestoneCommand : IUpdateProgressMilestoneCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateProgressMilestoneCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ProgressMilestoneReadDto>> ExecuteAsync(int topicId, ProgressMilestoneUpdateDto dto)
        {
            var entity = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topicId)
                .OrderByDescending(x => x.MilestoneID)
                .FirstOrDefaultAsync();

            if (entity == null)
                return OperationResult<ProgressMilestoneReadDto>.Failed("Milestone not found for the provided TopicID", 404);

            if (dto.TopicID.HasValue)
            {
                entity.TopicID = dto.TopicID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TopicCode))
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(x => x.TopicCode == dto.TopicCode);
                if (topic == null)
                    return OperationResult<ProgressMilestoneReadDto>.Failed("Topic not found for the provided TopicCode", 400);

                entity.TopicID = topic.TopicID;
            }

            if (!string.IsNullOrWhiteSpace(dto.TopicCode))
                entity.TopicCode = dto.TopicCode;

            if (!string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode) && !string.Equals(dto.MilestoneTemplateCode, entity.MilestoneTemplateCode, StringComparison.OrdinalIgnoreCase))
            {
                var template = await _uow.MilestoneTemplates.Query().FirstOrDefaultAsync(x => x.MilestoneTemplateCode == dto.MilestoneTemplateCode);
                if (template == null)
                    return OperationResult<ProgressMilestoneReadDto>.Failed("MilestoneTemplate not found", 400);

                entity.MilestoneTemplateCode = template.MilestoneTemplateCode;
                if (!dto.Ordinal.HasValue)
                    entity.Ordinal = template.Ordinal;
            }

            if (dto.Ordinal.HasValue)
                entity.Ordinal = dto.Ordinal;

            entity.Deadline = dto.Deadline;
            if (!string.IsNullOrWhiteSpace(dto.State))
                entity.State = dto.State;
            entity.StartedAt = dto.StartedAt;
            entity.CompletedAt1 = dto.CompletedAt1;
            entity.CompletedAt2 = dto.CompletedAt2;
            entity.CompletedAt3 = dto.CompletedAt3;
            entity.CompletedAt4 = dto.CompletedAt4;
            entity.CompletedAt5 = dto.CompletedAt5;
            entity.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;

            _uow.ProgressMilestones.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ProgressMilestoneReadDto>.Succeeded(_mapper.Map<ProgressMilestoneReadDto>(entity));
        }
    }
}

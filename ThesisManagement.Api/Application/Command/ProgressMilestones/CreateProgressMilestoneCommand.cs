using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.ProgressMilestones;
using ThesisManagement.Api.DTOs.ProgressMilestones.Command;
using ThesisManagement.Api.DTOs.ProgressMilestones.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressMilestones
{
    public interface ICreateProgressMilestoneCommand
    {
        Task<OperationResult<ProgressMilestoneReadDto>> ExecuteAsync(ProgressMilestoneCreateDto dto);
    }

    public class CreateProgressMilestoneCommand : ICreateProgressMilestoneCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateProgressMilestoneCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ProgressMilestoneReadDto>> ExecuteAsync(ProgressMilestoneCreateDto dto)
        {
            var validationError = ProgressMilestoneCommandValidator.ValidateCreate(dto.TopicCode);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<ProgressMilestoneReadDto>.Failed(validationError, 400);

            int topicId;
            if (dto.TopicID.HasValue)
            {
                topicId = dto.TopicID.Value;
            }
            else
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(x => x.TopicCode == dto.TopicCode);
                if (topic == null)
                    return OperationResult<ProgressMilestoneReadDto>.Failed("Topic not found for the provided TopicCode", 400);

                topicId = topic.TopicID;
            }

            var code = dto.MilestoneCode;
            if (string.IsNullOrWhiteSpace(code))
            {
                var now = DateTime.UtcNow;
                var prefix = $"MS{now:yyMMdd}";
                var recent = await _uow.ProgressMilestones.Query()
                    .Where(x => x.MilestoneCode != null && EF.Functions.Like(x.MilestoneCode, prefix + "%"))
                    .OrderByDescending(x => x.MilestoneID)
                    .Select(x => x.MilestoneCode)
                    .Take(100)
                    .ToListAsync();

                int maxSeq = 0;
                foreach (var recentCode in recent)
                {
                    if (string.IsNullOrWhiteSpace(recentCode) || recentCode.Length < prefix.Length + 3)
                        continue;

                    var suffix = recentCode.Substring(prefix.Length);
                    var digits = suffix.Length >= 3 ? suffix.Substring(suffix.Length - 3) : suffix;
                    if (int.TryParse(digits, out var n) && n > maxSeq)
                        maxSeq = n;
                }

                code = prefix + (maxSeq + 1).ToString("D3");
            }

            MilestoneTemplate? template = null;
            if (!string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode))
            {
                template = await _uow.MilestoneTemplates.Query().FirstOrDefaultAsync(x => x.MilestoneTemplateCode == dto.MilestoneTemplateCode);
                if (template == null)
                    return OperationResult<ProgressMilestoneReadDto>.Failed("MilestoneTemplate not found", 400);
            }

            var entity = new ProgressMilestone
            {
                MilestoneCode = string.IsNullOrWhiteSpace(dto.MilestoneCode) ? code : dto.MilestoneCode,
                TopicID = topicId,
                TopicCode = dto.TopicCode,
                Ordinal = dto.Ordinal ?? template?.Ordinal,
                Deadline = dto.Deadline,
                State = string.IsNullOrWhiteSpace(dto.State) ? "Chưa bắt đầu" : dto.State,
                StartedAt = dto.StartedAt,
                CompletedAt1 = dto.CompletedAt1,
                CompletedAt2 = dto.CompletedAt2,
                CompletedAt3 = dto.CompletedAt3,
                CompletedAt4 = dto.CompletedAt4,
                CompletedAt5 = dto.CompletedAt5,
                CreatedAt = dto.CreatedAt ?? DateTime.UtcNow,
                LastUpdated = dto.LastUpdated ?? DateTime.UtcNow
            };

            entity.MilestoneTemplateCode = template?.MilestoneTemplateCode ?? dto.MilestoneTemplateCode;

            await _uow.ProgressMilestones.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ProgressMilestoneReadDto>.Succeeded(_mapper.Map<ProgressMilestoneReadDto>(entity), 201);
        }
    }
}

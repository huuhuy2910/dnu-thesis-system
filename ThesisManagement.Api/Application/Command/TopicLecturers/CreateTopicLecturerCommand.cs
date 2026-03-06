using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.TopicLecturers;
using ThesisManagement.Api.DTOs.TopicLecturers.Command;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicLecturers
{
    public interface ICreateTopicLecturerCommand
    {
        Task<OperationResult<TopicLecturerCreateDto>> ExecuteAsync(TopicLecturerCreateDto dto);
    }

    public class CreateTopicLecturerCommand : ICreateTopicLecturerCommand
    {
        private readonly IUnitOfWork _uow;

        public CreateTopicLecturerCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<TopicLecturerCreateDto>> ExecuteAsync(TopicLecturerCreateDto dto)
        {
            var validationError = TopicLecturerCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicLecturerCreateDto>.Failed(validationError, 400);

            int topicId;
            string? topicCode;
            Topic? topicEntity = null;
            if (dto.TopicID.HasValue)
            {
                topicId = dto.TopicID.Value;
                topicCode = dto.TopicCode;
                topicEntity = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicID == topicId);
                if (topicEntity == null)
                    return OperationResult<TopicLecturerCreateDto>.Failed("Topic not found", 400);
            }
            else
            {
                topicEntity = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode!.Trim() == dto.TopicCode!.Trim());
                if (topicEntity == null)
                    return OperationResult<TopicLecturerCreateDto>.Failed("Topic not found", 400);
                topicId = topicEntity.TopicID;
                topicCode = topicEntity.TopicCode;
            }

            int lecturerProfileId;
            string? lecturerCode;
            LecturerProfile? lecturerEntity = null;
            if (dto.LecturerProfileID.HasValue)
            {
                lecturerProfileId = dto.LecturerProfileID.Value;
                lecturerCode = dto.LecturerCode;
                lecturerEntity = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerProfileID == lecturerProfileId);
                if (lecturerEntity == null)
                    return OperationResult<TopicLecturerCreateDto>.Failed("Lecturer profile not found", 400);
            }
            else
            {
                lecturerEntity = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerCode!.Trim() == dto.LecturerCode!.Trim());
                if (lecturerEntity == null)
                    return OperationResult<TopicLecturerCreateDto>.Failed("Lecturer profile not found", 400);
                lecturerProfileId = lecturerEntity.LecturerProfileID;
                lecturerCode = lecturerEntity.LecturerCode;
            }

            var ent = new TopicLecturer
            {
                TopicID = topicId,
                TopicCode = topicCode,
                LecturerProfileID = lecturerProfileId,
                LecturerCode = lecturerCode,
                IsPrimary = dto.IsPrimary,
                CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
                Topic = topicEntity,
                LecturerProfile = lecturerEntity
            };

            await _uow.TopicLecturers.AddAsync(ent);
            await _uow.SaveChangesAsync();

            return OperationResult<TopicLecturerCreateDto>.Succeeded(new TopicLecturerCreateDto(ent.TopicID, ent.TopicCode, ent.LecturerProfileID, ent.LecturerCode, ent.IsPrimary, ent.CreatedAt));
        }
    }
}

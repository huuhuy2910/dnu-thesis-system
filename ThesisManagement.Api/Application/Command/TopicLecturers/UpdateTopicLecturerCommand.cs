using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.TopicLecturers.Command;
using ThesisManagement.Api.DTOs.TopicLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicLecturers
{
    public interface IUpdateTopicLecturerCommand
    {
        Task<OperationResult<TopicLecturerReadDto>> ExecuteAsync(int topicId, int lecturerProfileId, TopicLecturerUpdateDto dto);
    }

    public class UpdateTopicLecturerCommand : IUpdateTopicLecturerCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateTopicLecturerCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TopicLecturerReadDto>> ExecuteAsync(int topicId, int lecturerProfileId, TopicLecturerUpdateDto dto)
        {
            var item = await _uow.TopicLecturers.Query().FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null)
                return OperationResult<TopicLecturerReadDto>.Failed("TopicLecturer not found", 404);

            if (dto.TopicID.HasValue)
            {
                item.TopicID = dto.TopicID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TopicCode))
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode!.Trim() == dto.TopicCode.Trim());
                if (topic == null)
                    return OperationResult<TopicLecturerReadDto>.Failed("Topic not found", 400);
                item.TopicID = topic.TopicID;
                item.TopicCode = topic.TopicCode;
            }

            if (dto.LecturerProfileID.HasValue)
            {
                item.LecturerProfileID = dto.LecturerProfileID.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.LecturerCode))
            {
                var lecturer = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(l => l.LecturerCode!.Trim() == dto.LecturerCode.Trim());
                if (lecturer == null)
                    return OperationResult<TopicLecturerReadDto>.Failed("Lecturer profile not found", 400);
                item.LecturerProfileID = lecturer.LecturerProfileID;
                item.LecturerCode = lecturer.LecturerCode;
            }

            if (dto.IsPrimary.HasValue) item.IsPrimary = dto.IsPrimary.Value;
            if (dto.CreatedAt.HasValue) item.CreatedAt = dto.CreatedAt.Value;

            _uow.TopicLecturers.Update(item);
            await _uow.SaveChangesAsync();
            return OperationResult<TopicLecturerReadDto>.Succeeded(_mapper.Map<TopicLecturerReadDto>(item));
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.TopicTags.Command;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicTags
{
    public interface IUpdateTopicTagByTopicCodeCommand
    {
        Task<OperationResult<TopicTagReadDto>> ExecuteAsync(string topicCode, int topicTagID, TopicTagUpdateDto dto);
    }

    public class UpdateTopicTagByTopicCodeCommand : IUpdateTopicTagByTopicCodeCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateTopicTagByTopicCodeCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TopicTagReadDto>> ExecuteAsync(string topicCode, int topicTagID, TopicTagUpdateDto dto)
        {
            var entity = await _uow.TopicTags.Query().FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagID && tt.TopicCode == topicCode);
            if (entity == null)
                return OperationResult<TopicTagReadDto>.Failed("TopicTag not found", 404);

            if (dto.TagID.HasValue && dto.TagID.Value > 0)
            {
                entity.TagID = dto.TagID.Value;
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(t => t.TagID == dto.TagID.Value);
                if (tag != null) entity.TagCode = tag.TagCode;
            }
            else if (!string.IsNullOrWhiteSpace(dto.TagCode))
            {
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(t => t.TagCode == dto.TagCode);
                if (tag == null)
                    return OperationResult<TopicTagReadDto>.Failed($"Tag with code '{dto.TagCode}' not found", 404);
                entity.TagID = tag.TagID;
                entity.TagCode = tag.TagCode;
            }

            _uow.TopicTags.Update(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<TopicTagReadDto>.Succeeded(_mapper.Map<TopicTagReadDto>(entity));
        }
    }
}

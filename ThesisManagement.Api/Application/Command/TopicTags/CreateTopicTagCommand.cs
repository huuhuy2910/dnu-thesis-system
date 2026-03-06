using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.TopicTags;
using ThesisManagement.Api.DTOs.TopicTags.Command;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.TopicTags
{
    public interface ICreateTopicTagCommand
    {
        Task<OperationResult<TopicTagReadDto>> ExecuteAsync(TopicTagCreateDto dto);
    }

    public class CreateTopicTagCommand : ICreateTopicTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateTopicTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TopicTagReadDto>> ExecuteAsync(TopicTagCreateDto dto)
        {
            var validationError = TopicTagCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicTagReadDto>.Failed(validationError, 400);

            var tagId = dto.TagID ?? 0;
            if (tagId == 0 && !string.IsNullOrEmpty(dto.TagCode))
            {
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(t => t.TagCode == dto.TagCode);
                if (tag == null)
                    return OperationResult<TopicTagReadDto>.Failed($"Tag with code '{dto.TagCode}' not found", 404);
                tagId = tag.TagID;
            }

            var catalogTopicCode = dto.CatalogTopicCode;
            var topicCode = dto.TopicCode;
            if (string.IsNullOrWhiteSpace(catalogTopicCode) && !string.IsNullOrWhiteSpace(topicCode))
            {
                var topic = await _uow.Topics.Query().FirstOrDefaultAsync(t => t.TopicCode == topicCode);
                if (topic == null)
                    return OperationResult<TopicTagReadDto>.Failed($"Topic with code '{topicCode}' not found", 404);
                catalogTopicCode = topic.CatalogTopicCode;
            }

            var entity = new TopicTag
            {
                TagID = tagId,
                TagCode = dto.TagCode,
                CatalogTopicCode = catalogTopicCode,
                TopicCode = dto.TopicCode,
                CreatedAt = DateTime.Now
            };

            await _uow.TopicTags.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<TopicTagReadDto>.Succeeded(_mapper.Map<TopicTagReadDto>(entity));
        }
    }
}

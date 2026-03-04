using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicTags
{
    public interface IGetTopicTagDetailQuery
    {
        Task<TopicTagReadDto?> ExecuteAsync(string topicCode, int topicTagId);
    }

    public class GetTopicTagDetailQuery : IGetTopicTagDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicTagDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<TopicTagReadDto?> ExecuteAsync(string topicCode, int topicTagId)
        {
            var entity = await _uow.TopicTags.Query().FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagId && tt.TopicCode == topicCode);
            return entity == null ? null : _mapper.Map<TopicTagReadDto>(entity);
        }
    }
}

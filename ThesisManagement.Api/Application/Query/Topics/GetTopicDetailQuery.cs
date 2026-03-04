using AutoMapper;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Topics
{
    public interface IGetTopicDetailQuery
    {
        Task<TopicReadDto?> ExecuteAsync(string code);
    }

    public class GetTopicDetailQuery : IGetTopicDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<TopicReadDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.Topics.GetByCodeAsync(code);
            return entity == null ? null : _mapper.Map<TopicReadDto>(entity);
        }
    }
}

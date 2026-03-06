using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.TopicTags.Command;
using ThesisManagement.Api.DTOs.TopicTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicTags
{
    public interface IGetTopicTagCreateQuery
    {
        TopicTagCreateDto Execute();
    }

    public interface IGetTopicTagsByTopicQuery
    {
        Task<IEnumerable<TopicTagReadDto>> ExecuteAsync(string topicCode);
    }

    public interface IGetTopicTagsByCatalogTopicQuery
    {
        Task<IEnumerable<TopicTagReadDto>> ExecuteAsync(string catalogTopicCode);
    }

    public interface IGetTopicTagUpdateByTopicCodeQuery
    {
        Task<TopicTagReadDto?> ExecuteAsync(string topicCode, int topicTagId);
    }

    public class GetTopicTagCreateQuery : IGetTopicTagCreateQuery
    {
        public TopicTagCreateDto Execute() => new(null, null, null, null);
    }

    public class GetTopicTagsByTopicQuery : IGetTopicTagsByTopicQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetTopicTagsByTopicQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<IEnumerable<TopicTagReadDto>> ExecuteAsync(string topicCode)
        {
            var list = await _uow.TopicTags.Query().Where(x => x.TopicCode == topicCode).ToListAsync();
            return list.Select(x => _mapper.Map<TopicTagReadDto>(x));
        }
    }

    public class GetTopicTagsByCatalogTopicQuery : IGetTopicTagsByCatalogTopicQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetTopicTagsByCatalogTopicQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<IEnumerable<TopicTagReadDto>> ExecuteAsync(string catalogTopicCode)
        {
            var list = await _uow.TopicTags.Query().Where(x => x.CatalogTopicCode == catalogTopicCode).ToListAsync();
            return list.Select(x => _mapper.Map<TopicTagReadDto>(x));
        }
    }

    public class GetTopicTagUpdateByTopicCodeQuery : IGetTopicTagUpdateByTopicCodeQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetTopicTagUpdateByTopicCodeQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<TopicTagReadDto?> ExecuteAsync(string topicCode, int topicTagId)
        {
            var entity = await _uow.TopicTags.Query().FirstOrDefaultAsync(tt => tt.TopicTagID == topicTagId && tt.TopicCode == topicCode);
            return entity == null ? null : _mapper.Map<TopicTagReadDto>(entity);
        }
    }
}

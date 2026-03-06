using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.TopicLecturers.Command;
using ThesisManagement.Api.DTOs.TopicLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicLecturers
{
    public interface IGetTopicLecturerCreateQuery
    {
        TopicLecturerCreateDto Execute();
    }

    public interface IGetTopicLecturerUpdateQuery
    {
        Task<TopicLecturerUpdateDto?> ExecuteAsync(int topicId, int lecturerProfileId);
    }

    public interface IGetTopicLecturersByTopicQuery
    {
        Task<(IEnumerable<TopicLecturerReadDto> Items, int Count)> ExecuteAsync(int topicId);
    }

    public interface IGetTopicLecturersByLecturerQuery
    {
        Task<(IEnumerable<TopicLecturerReadDto> Items, int Count)> ExecuteAsync(int lecturerProfileId);
    }

    public class GetTopicLecturerCreateQuery : IGetTopicLecturerCreateQuery
    {
        public TopicLecturerCreateDto Execute() => new(null, null, null, null, false, DateTime.UtcNow);
    }

    public class GetTopicLecturerUpdateQuery : IGetTopicLecturerUpdateQuery
    {
        private readonly IUnitOfWork _uow;
        public GetTopicLecturerUpdateQuery(IUnitOfWork uow) { _uow = uow; }
        public async Task<TopicLecturerUpdateDto?> ExecuteAsync(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query().FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            if (item == null) return null;
            return new TopicLecturerUpdateDto(item.TopicID, item.TopicCode, item.LecturerProfileID, item.LecturerCode, item.IsPrimary, item.CreatedAt);
        }
    }

    public class GetTopicLecturersByTopicQuery : IGetTopicLecturersByTopicQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetTopicLecturersByTopicQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<(IEnumerable<TopicLecturerReadDto> Items, int Count)> ExecuteAsync(int topicId)
        {
            var items = await _uow.TopicLecturers.Query().Where(x => x.TopicID == topicId).ToListAsync();
            return (items.Select(x => _mapper.Map<TopicLecturerReadDto>(x)), items.Count);
        }
    }

    public class GetTopicLecturersByLecturerQuery : IGetTopicLecturersByLecturerQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetTopicLecturersByLecturerQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<(IEnumerable<TopicLecturerReadDto> Items, int Count)> ExecuteAsync(int lecturerProfileId)
        {
            var items = await _uow.TopicLecturers.Query().Where(x => x.LecturerProfileID == lecturerProfileId).ToListAsync();
            return (items.Select(x => _mapper.Map<TopicLecturerReadDto>(x)), items.Count);
        }
    }
}

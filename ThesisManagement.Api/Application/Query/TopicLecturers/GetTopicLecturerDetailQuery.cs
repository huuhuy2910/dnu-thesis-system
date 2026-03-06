using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.TopicLecturers.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicLecturers
{
    public interface IGetTopicLecturerDetailQuery
    {
        Task<TopicLecturerReadDto?> ExecuteAsync(int topicId, int lecturerProfileId);
    }

    public class GetTopicLecturerDetailQuery : IGetTopicLecturerDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicLecturerDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<TopicLecturerReadDto?> ExecuteAsync(int topicId, int lecturerProfileId)
        {
            var item = await _uow.TopicLecturers.Query().FirstOrDefaultAsync(x => x.TopicID == topicId && x.LecturerProfileID == lecturerProfileId);
            return item == null ? null : _mapper.Map<TopicLecturerReadDto>(item);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.DTOs.TopicLecturers.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.TopicLecturers
{
    public interface IGetTopicLecturersListQuery
    {
        Task<(IEnumerable<TopicLecturerReadDto> Items, int TotalCount)> ExecuteAsync(TopicLecturerFilter filter);
    }

    public class GetTopicLecturersListQuery : IGetTopicLecturersListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetTopicLecturersListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<TopicLecturerReadDto> Items, int TotalCount)> ExecuteAsync(TopicLecturerFilter filter)
        {
            var result = await _uow.TopicLecturers.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<TopicLecturerReadDto>(x)), result.TotalCount);
        }
    }
}

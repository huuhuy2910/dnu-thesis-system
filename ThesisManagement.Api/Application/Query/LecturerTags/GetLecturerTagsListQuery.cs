using AutoMapper;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.LecturerTags
{
    public interface IGetLecturerTagsListQuery
    {
        Task<(IEnumerable<LecturerTagReadDto> Items, int TotalCount)> ExecuteAsync(LecturerTagFilter filter);
    }

    public class GetLecturerTagsListQuery : IGetLecturerTagsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetLecturerTagsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<LecturerTagReadDto> Items, int TotalCount)> ExecuteAsync(LecturerTagFilter filter)
        {
            var result = await _uow.LecturerTags.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<LecturerTagReadDto>(x)), result.TotalCount);
        }
    }
}

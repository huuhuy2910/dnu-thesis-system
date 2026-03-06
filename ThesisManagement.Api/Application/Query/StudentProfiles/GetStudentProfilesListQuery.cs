using AutoMapper;
using ThesisManagement.Api.DTOs.StudentProfiles.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.StudentProfiles
{
    public interface IGetStudentProfilesListQuery
    {
        Task<(IEnumerable<StudentProfileReadDto> Items, int TotalCount)> ExecuteAsync(StudentProfileFilter filter);
    }

    public class GetStudentProfilesListQuery : IGetStudentProfilesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetStudentProfilesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<StudentProfileReadDto> Items, int TotalCount)> ExecuteAsync(StudentProfileFilter filter)
        {
            var result = await _uow.StudentProfiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            return (result.Items.Select(x => _mapper.Map<StudentProfileReadDto>(x)), result.TotalCount);
        }
    }
}

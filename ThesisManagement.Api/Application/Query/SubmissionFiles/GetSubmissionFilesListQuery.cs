using AutoMapper;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.SubmissionFiles
{
    public interface IGetSubmissionFilesListQuery
    {
        Task<(IEnumerable<SubmissionFileReadDto> Items, int TotalCount)> ExecuteAsync(SubmissionFileFilter filter);
    }

    public class GetSubmissionFilesListQuery : IGetSubmissionFilesListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetSubmissionFilesListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<SubmissionFileReadDto> Items, int TotalCount)> ExecuteAsync(SubmissionFileFilter filter)
        {
            var result = await _uow.SubmissionFiles.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter,
                (query, f) => query.ApplyFilter(f));

            return (result.Items.Select(x => _mapper.Map<SubmissionFileReadDto>(x)), result.TotalCount);
        }
    }
}

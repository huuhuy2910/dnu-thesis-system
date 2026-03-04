using AutoMapper;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ProgressSubmissions
{
    public interface IGetProgressSubmissionDetailQuery
    {
        Task<ProgressSubmissionReadDto?> ExecuteAsync(string code);
    }

    public class GetProgressSubmissionDetailQuery : IGetProgressSubmissionDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetProgressSubmissionDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<ProgressSubmissionReadDto?> ExecuteAsync(string code)
        {
            var ent = await _uow.ProgressSubmissions.GetByCodeAsync(code);
            return ent == null ? null : _mapper.Map<ProgressSubmissionReadDto>(ent);
        }
    }
}

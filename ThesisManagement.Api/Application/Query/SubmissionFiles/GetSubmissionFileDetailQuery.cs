using AutoMapper;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.SubmissionFiles
{
    public interface IGetSubmissionFileDetailQuery
    {
        Task<SubmissionFileReadDto?> ExecuteAsync(int id);
    }

    public class GetSubmissionFileDetailQuery : IGetSubmissionFileDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetSubmissionFileDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<SubmissionFileReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<SubmissionFileReadDto>(entity);
        }
    }
}

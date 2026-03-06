using ThesisManagement.Api.DTOs.SubmissionFiles.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.SubmissionFiles
{
    public interface IGetSubmissionFileCreateQuery
    {
        SubmissionFileCreateDto Execute();
    }

    public interface IGetSubmissionFileUpdateQuery
    {
        Task<SubmissionFileUpdateDto?> ExecuteAsync(int id);
    }

    public class GetSubmissionFileCreateQuery : IGetSubmissionFileCreateQuery
    {
        public SubmissionFileCreateDto Execute() => new(0, null, string.Empty, null, null, null, null, null, null);
    }

    public class GetSubmissionFileUpdateQuery : IGetSubmissionFileUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetSubmissionFileUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<SubmissionFileUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new SubmissionFileUpdateDto(
                entity.FileURL,
                entity.FileName,
                entity.FileSizeBytes,
                entity.MimeType,
                entity.UploadedAt,
                entity.UploadedByUserCode,
                entity.UploadedByUserID);
        }
    }
}

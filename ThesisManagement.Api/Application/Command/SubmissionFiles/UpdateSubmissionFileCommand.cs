using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.SubmissionFiles.Command;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.SubmissionFiles
{
    public interface IUpdateSubmissionFileCommand
    {
        Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(int id, SubmissionFileUpdateDto dto);
    }

    public class UpdateSubmissionFileCommand : IUpdateSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateSubmissionFileCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(int id, SubmissionFileUpdateDto dto)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<SubmissionFileReadDto>.Failed("Submission file not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.FileURL))
                entity.FileURL = dto.FileURL;

            if (dto.FileName != null)
                entity.FileName = dto.FileName;
            if (dto.FileSizeBytes.HasValue)
                entity.FileSizeBytes = dto.FileSizeBytes;
            if (dto.MimeType != null)
                entity.MimeType = dto.MimeType;
            if (dto.UploadedAt.HasValue)
                entity.UploadedAt = dto.UploadedAt;
            if (dto.UploadedByUserCode != null)
                entity.UploadedByUserCode = dto.UploadedByUserCode;
            if (dto.UploadedByUserID.HasValue)
                entity.UploadedByUserID = dto.UploadedByUserID;

            _uow.SubmissionFiles.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<SubmissionFileReadDto>.Succeeded(_mapper.Map<SubmissionFileReadDto>(entity));
        }
    }
}

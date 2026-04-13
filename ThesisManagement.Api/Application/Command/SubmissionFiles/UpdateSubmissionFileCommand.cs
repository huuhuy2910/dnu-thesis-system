using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.SubmissionFiles.Command;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

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
        private readonly IFileStorageService _storageService;

        public UpdateSubmissionFileCommand(IUnitOfWork uow, IMapper mapper, IFileStorageService storageService)
        {
            _uow = uow;
            _mapper = mapper;
            _storageService = storageService;
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(int id, SubmissionFileUpdateDto dto)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<SubmissionFileReadDto>.Failed("Submission file not found", 404);

            var oldFileUrl = entity.FileURL;
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

            if (!string.IsNullOrWhiteSpace(oldFileUrl) && !string.Equals(oldFileUrl, entity.FileURL, StringComparison.OrdinalIgnoreCase))
            {
                await _storageService.DeleteAsync(oldFileUrl);
            }

            return OperationResult<SubmissionFileReadDto>.Succeeded(_mapper.Map<SubmissionFileReadDto>(entity));
        }
    }
}

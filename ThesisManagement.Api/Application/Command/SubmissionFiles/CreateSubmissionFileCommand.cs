using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.SubmissionFiles;
using ThesisManagement.Api.DTOs.SubmissionFiles.Command;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.SubmissionFiles
{
    public interface ICreateSubmissionFileCommand
    {
        Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(SubmissionFileCreateDto dto);
        Task<OperationResult<SubmissionFileReadDto>> ExecuteMultipartAsync(SubmissionFileMultipartCreateDto request, IFormFile? file);
    }

    public class CreateSubmissionFileCommand : ICreateSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _storageService;

        public CreateSubmissionFileCommand(IUnitOfWork uow, IMapper mapper, IFileStorageService storageService)
        {
            _uow = uow;
            _mapper = mapper;
            _storageService = storageService;
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(SubmissionFileCreateDto dto)
        {
            var validationError = SubmissionFileCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<SubmissionFileReadDto>.Failed(validationError, 400);

            var entity = new SubmissionFile
            {
                SubmissionID = dto.SubmissionID,
                SubmissionCode = dto.SubmissionCode,
                FileURL = dto.FileURL,
                FileName = dto.FileName,
                FileSizeBytes = dto.FileSizeBytes,
                MimeType = dto.MimeType,
                UploadedAt = dto.UploadedAt ?? DateTime.UtcNow,
                UploadedByUserCode = dto.UploadedByUserCode,
                UploadedByUserID = dto.UploadedByUserID
            };

            await _uow.SubmissionFiles.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<SubmissionFileReadDto>.Succeeded(_mapper.Map<SubmissionFileReadDto>(entity), 201);
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteMultipartAsync(SubmissionFileMultipartCreateDto request, IFormFile? file)
        {
            var fileUrl = string.Empty;
            string? finalFileName = request.FileName;
            long? finalFileSize = request.FileSizeBytes;
            string? finalMimeType = request.MimeType;

            if (file != null && file.Length > 0)
            {
                var uploadResult = await _storageService.UploadAsync(file, "uploads");
                if (!uploadResult.Success)
                    return OperationResult<SubmissionFileReadDto>.Failed(uploadResult.ErrorMessage ?? "Upload file failed", uploadResult.StatusCode);

                fileUrl = uploadResult.Data!;
                finalFileName = Path.GetFileName(file.FileName);
                finalFileSize = file.Length;
                finalMimeType = file.ContentType;
            }

            var dto = new SubmissionFileCreateDto(
                request.SubmissionID,
                request.SubmissionCode,
                fileUrl,
                finalFileName,
                finalFileSize,
                finalMimeType,
                request.UploadedAt,
                request.UploadedByUserCode,
                request.UploadedByUserID);

            return await ExecuteAsync(dto);
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.SubmissionFiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.SubmissionFiles
{
    public sealed record SubmissionFileMultipartCreateDto(
        int SubmissionID,
        string? SubmissionCode,
        string? FileName,
        long? FileSizeBytes,
        string? MimeType,
        DateTime? UploadedAt,
        string? UploadedByUserCode,
        int? UploadedByUserID);

    public sealed record SubmissionFileDownloadResult(Stream Stream, string ContentType, string FileName);

    public interface IUploadSubmissionFileCommand
    {
        Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(IFormFile? file, int submissionID, string? submissionCode, string? uploadedByUserCode, int? uploadedByUserID);
    }

    public interface IDownloadSubmissionFileCommand
    {
        Task<OperationResult<SubmissionFileDownloadResult>> ExecuteAsync(int id);
    }
    public class UploadSubmissionFileCommand : IUploadSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _storageService;

        public UploadSubmissionFileCommand(IUnitOfWork uow, IMapper mapper, IFileStorageService storageService)
        {
            _uow = uow;
            _mapper = mapper;
            _storageService = storageService;
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(IFormFile? file, int submissionID, string? submissionCode, string? uploadedByUserCode, int? uploadedByUserID)
        {
            var validationError = SubmissionFileCommandValidator.ValidateUpload(submissionID, file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<SubmissionFileReadDto>.Failed(validationError, 400);

            var storageResult = await _storageService.UploadAsync(file!, "uploads");
            if (!storageResult.Success)
                return OperationResult<SubmissionFileReadDto>.Failed(storageResult.ErrorMessage ?? "Upload file failed", storageResult.StatusCode);

            var originalFileName = Path.GetFileName(file!.FileName);
            var fileUrl = storageResult.Data!;

            var entity = new SubmissionFile
            {
                SubmissionID = submissionID,
                SubmissionCode = submissionCode,
                FileURL = fileUrl,
                FileName = originalFileName,
                FileSizeBytes = file.Length,
                MimeType = file.ContentType,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserCode = uploadedByUserCode,
                UploadedByUserID = uploadedByUserID
            };

            await _uow.SubmissionFiles.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<SubmissionFileReadDto>.Succeeded(_mapper.Map<SubmissionFileReadDto>(entity), 201);
        }
    }
    public class DownloadSubmissionFileCommand : IDownloadSubmissionFileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DownloadSubmissionFileCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<SubmissionFileDownloadResult>> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<SubmissionFileDownloadResult>.Failed("Submission file not found", 404);

            var url = entity.FileURL;
            if (string.IsNullOrWhiteSpace(url))
                return OperationResult<SubmissionFileDownloadResult>.Failed("File URL not set", 404);

            var fileResult = await _storageService.OpenReadAsync(url);
            if (!fileResult.Success)
                return OperationResult<SubmissionFileDownloadResult>.Failed(fileResult.ErrorMessage ?? "File not found", fileResult.StatusCode);

            var contentType = entity.MimeType ?? fileResult.Data!.ContentType;
            var fileName = entity.FileName ?? fileResult.Data!.FileName;

            return OperationResult<SubmissionFileDownloadResult>.Succeeded(
                new SubmissionFileDownloadResult(fileResult.Data!.Stream, contentType, fileName));
        }
    }
}

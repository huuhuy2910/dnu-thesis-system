using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.SubmissionFiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.SubmissionFiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

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

        public UploadSubmissionFileCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<SubmissionFileReadDto>> ExecuteAsync(IFormFile? file, int submissionID, string? submissionCode, string? uploadedByUserCode, int? uploadedByUserID)
        {
            var validationError = SubmissionFileCommandValidator.ValidateUpload(submissionID, file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<SubmissionFileReadDto>.Failed(validationError, 400);

            var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsRoot))
                Directory.CreateDirectory(uploadsRoot);

            var originalFileName = Path.GetFileName(file!.FileName);
            var uniqueName = $"{Guid.NewGuid():N}_{originalFileName}";
            var savePath = Path.Combine(uploadsRoot, uniqueName);

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{uniqueName}";

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

        public DownloadSubmissionFileCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<SubmissionFileDownloadResult>> ExecuteAsync(int id)
        {
            var entity = await _uow.SubmissionFiles.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<SubmissionFileDownloadResult>.Failed("Submission file not found", 404);

            var url = entity.FileURL;
            if (string.IsNullOrWhiteSpace(url))
                return OperationResult<SubmissionFileDownloadResult>.Failed("File URL not set", 404);

            var relative = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var physical = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relative.Substring("uploads".Length).TrimStart(Path.DirectorySeparatorChar));

            if (!physical.Contains("uploads"))
            {
                physical = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", url.TrimStart('/'));
            }

            if (!System.IO.File.Exists(physical))
                return OperationResult<SubmissionFileDownloadResult>.Failed("File not found on disk", 404);

            var stream = System.IO.File.OpenRead(physical);
            var contentType = entity.MimeType ?? "application/octet-stream";
            var fileName = entity.FileName ?? Path.GetFileName(physical);

            return OperationResult<SubmissionFileDownloadResult>.Succeeded(
                new SubmissionFileDownloadResult(stream, contentType, fileName));
        }
    }
}

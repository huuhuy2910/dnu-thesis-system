using System.Security.Cryptography;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.TopicRenameRequests;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Command;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;
using ThesisManagement.Api.Services.TopicRenameRequests;

namespace ThesisManagement.Api.Application.Command.TopicRenameRequests
{
    public interface ICreateTopicRenameRequestCommand
    {
        Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(TopicRenameRequestCreateDto dto);
    }

    public interface IUpdateTopicRenameRequestCommand
    {
        Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(int id, TopicRenameRequestUpdateDto dto);
    }

    public interface IDeleteTopicRenameRequestCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public interface IReviewTopicRenameRequestCommand
    {
        Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(int id, TopicRenameRequestReviewDto dto);
    }

    public interface IGenerateTopicRenameRequestTemplateCommand
    {
        Task<OperationResult<TopicRenameRequestFileReadDto>> ExecuteAsync(int id, string? placeOfBirth = null);
    }

    public interface IDeleteTopicRenameRequestTemplateCommand
    {
        Task<OperationResult<string>> ExecuteAsync(int id);
    }

    public class CreateTopicRenameRequestCommand : ICreateTopicRenameRequestCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly ITopicRenameRequestContextService _contextService;

        public CreateTopicRenameRequestCommand(IUnitOfWork uow, IMapper mapper, ICurrentUserService currentUserService, ITopicRenameRequestContextService contextService)
        {
            _uow = uow;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _contextService = contextService;
        }

        public async Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(TopicRenameRequestCreateDto dto)
        {
            var validationError = TopicRenameRequestCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicRenameRequestReadDto>.Failed(validationError, 400);

            var topic = await _contextService.ResolveTopicAsync(dto.TopicID, dto.TopicCode);
            if (topic == null)
                return OperationResult<TopicRenameRequestReadDto>.Failed("Topic not found", 404);

            var actorUserCode = _currentUserService.GetUserCode();
            var actorUserId = _currentUserService.GetUserId();
            var actorRole = _currentUserService.GetUserRole();
            if (string.IsNullOrWhiteSpace(actorUserCode) || !actorUserId.HasValue)
                return OperationResult<TopicRenameRequestReadDto>.Failed("Unauthorized", 401);

            var entity = new TopicRenameRequest
            {
                RequestCode = null!,
                TopicId = topic.TopicID,
                TopicCode = topic.TopicCode,
                OldTitle = topic.Title,
                NewTitle = dto.NewTitle.Trim(),
                Reason = dto.Reason,
                Status = "PENDING",
                RequestedByUserId = actorUserId.Value,
                RequestedByUserCode = actorUserCode,
                RequestedByRole = actorRole ?? "Student",
                ReviewedByUserCode = string.IsNullOrWhiteSpace(dto.ReviewedByUserCode) ? null : dto.ReviewedByUserCode.Trim(),
                ReviewedByRole = string.IsNullOrWhiteSpace(dto.ReviewedByRole) ? null : dto.ReviewedByRole.Trim(),
                RequestedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.TopicRenameRequests.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<TopicRenameRequestReadDto>.Succeeded(_mapper.Map<TopicRenameRequestReadDto>(entity), 201);
        }
    }

    public class UpdateTopicRenameRequestCommand : IUpdateTopicRenameRequestCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateTopicRenameRequestCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(int id, TopicRenameRequestUpdateDto dto)
        {
            var validationError = TopicRenameRequestCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicRenameRequestReadDto>.Failed(validationError, 400);

            var entity = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<TopicRenameRequestReadDto>.Failed("TopicRenameRequest not found", 404);

            if (!string.Equals(entity.Status, "PENDING", StringComparison.OrdinalIgnoreCase) && !string.Equals(entity.Status, "REJECTED", StringComparison.OrdinalIgnoreCase))
                return OperationResult<TopicRenameRequestReadDto>.Failed("Only pending or rejected requests can be updated", 409);

            if (!string.IsNullOrWhiteSpace(dto.NewTitle))
                entity.NewTitle = dto.NewTitle.Trim();
            if (dto.Reason is not null)
                entity.Reason = dto.Reason;

            entity.LastUpdated = DateTime.UtcNow;
            _uow.TopicRenameRequests.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<TopicRenameRequestReadDto>.Succeeded(_mapper.Map<TopicRenameRequestReadDto>(entity));
        }
    }

    public class DeleteTopicRenameRequestCommand : IDeleteTopicRenameRequestCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DeleteTopicRenameRequestCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var entity = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<string>.Failed("TopicRenameRequest not found", 404);

            if (!string.IsNullOrWhiteSpace(entity.GeneratedFileUrl))
                await _storageService.DeleteAsync(entity.GeneratedFileUrl);

            _uow.TopicRenameRequests.Remove(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<string>.Succeeded("TopicRenameRequest deleted successfully");
        }
    }

    public class ReviewTopicRenameRequestCommand : IReviewTopicRenameRequestCommand
    {
        private readonly ApplicationDbContext _db;
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public ReviewTopicRenameRequestCommand(ApplicationDbContext db, IUnitOfWork uow, IMapper mapper, ICurrentUserService currentUserService)
        {
            _db = db;
            _uow = uow;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<TopicRenameRequestReadDto>> ExecuteAsync(int id, TopicRenameRequestReviewDto dto)
        {
            var validationError = TopicRenameRequestCommandValidator.ValidateReview(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicRenameRequestReadDto>.Failed(validationError, 400);

            var entity = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<TopicRenameRequestReadDto>.Failed("TopicRenameRequest not found", 404);

            if (!string.Equals(entity.Status, "PENDING", StringComparison.OrdinalIgnoreCase))
                return OperationResult<TopicRenameRequestReadDto>.Failed("Only pending requests can be reviewed", 409);

            var reviewerUserCode = _currentUserService.GetUserCode();
            var reviewerUserId = _currentUserService.GetUserId();
            var reviewerRole = _currentUserService.GetUserRole();
            if (!reviewerUserId.HasValue || string.IsNullOrWhiteSpace(reviewerUserCode))
                return OperationResult<TopicRenameRequestReadDto>.Failed("Unauthorized", 401);

            var action = dto.Action.Trim().ToLowerInvariant();
            if (action == "approve")
            {
                await using var tx = await _db.Database.BeginTransactionAsync();
                try
                {
                    var topic = await _uow.Topics.GetByIdAsync(entity.TopicId ?? 0);
                    if (topic == null)
                        return OperationResult<TopicRenameRequestReadDto>.Failed("Topic not found", 404);

                    var previousTitle = topic.Title;
                    topic.Title = entity.NewTitle;
                    topic.LastUpdated = DateTime.UtcNow;
                    _uow.Topics.Update(topic);

                    entity.Status = "APPLIED";
                    entity.ReviewedByUserId = reviewerUserId;
                    entity.ReviewedByUserCode = reviewerUserCode;
                    entity.ReviewedByRole = reviewerRole;
                    entity.ReviewComment = dto.Comment;
                    entity.ReviewedAt = DateTime.UtcNow;
                    entity.AppliedAt = DateTime.UtcNow;
                    entity.LastUpdated = DateTime.UtcNow;
                    _uow.TopicRenameRequests.Update(entity);

                    var history = new TopicTitleHistory
                    {
                        HistoryCode = null!,
                        TopicId = topic.TopicID,
                        TopicCode = topic.TopicCode,
                        RequestId = entity.RequestId,
                        RequestCode = entity.RequestCode,
                        PreviousTitle = previousTitle,
                        NewTitle = entity.NewTitle,
                        ChangeType = "RENAME_APPROVED",
                        ChangeReason = entity.Reason,
                        ApprovalComment = dto.Comment,
                        ChangedByUserId = entity.RequestedByUserId,
                        ChangedByUserCode = entity.RequestedByUserCode,
                        ChangedByRole = entity.RequestedByRole,
                        ApprovedByUserId = reviewerUserId,
                        ApprovedByUserCode = reviewerUserCode,
                        ApprovedByRole = reviewerRole,
                        EffectiveAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow
                    };

                    await _uow.TopicTitleHistories.AddAsync(history);
                    await _uow.SaveChangesAsync();
                    await tx.CommitAsync();
                }
                catch
                {
                    await _db.Database.RollbackTransactionAsync();
                    throw;
                }
            }
            else
            {
                entity.Status = "REJECTED";
                entity.ReviewedByUserId = reviewerUserId;
                entity.ReviewedByUserCode = reviewerUserCode;
                entity.ReviewedByRole = reviewerRole;
                entity.ReviewComment = dto.Comment;
                entity.ReviewedAt = DateTime.UtcNow;
                entity.LastUpdated = DateTime.UtcNow;
                _uow.TopicRenameRequests.Update(entity);
                await _uow.SaveChangesAsync();
            }

            return OperationResult<TopicRenameRequestReadDto>.Succeeded(_mapper.Map<TopicRenameRequestReadDto>(entity));
        }
    }

    public class GenerateTopicRenameRequestTemplateCommand : IGenerateTopicRenameRequestTemplateCommand
    {
        private const string DocxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        private readonly IUnitOfWork _uow;
        private readonly ApplicationDbContext _db;
        private readonly ITopicRenameRequestContextService _contextService;
        private readonly ITopicRenameDocumentService _documentService;
        private readonly IFileStorageService _storageService;
        private readonly ICurrentUserService _currentUserService;

        public GenerateTopicRenameRequestTemplateCommand(
            IUnitOfWork uow,
            ApplicationDbContext db,
            ITopicRenameRequestContextService contextService,
            ITopicRenameDocumentService documentService,
            IFileStorageService storageService,
            ICurrentUserService currentUserService)
        {
            _uow = uow;
            _db = db;
            _contextService = contextService;
            _documentService = documentService;
            _storageService = storageService;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<TopicRenameRequestFileReadDto>> ExecuteAsync(int id, string? placeOfBirth = null)
        {
            var request = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (request == null)
                return OperationResult<TopicRenameRequestFileReadDto>.Failed("TopicRenameRequest not found", 404);

            var templateData = await _contextService.BuildTemplateDataAsync(request, placeOfBirth);
            var bytes = await _documentService.BuildTemplateAsync(templateData);

            var fileName = $"{request.RequestCode}_topic-rename-template.docx";
            await using var stream = new MemoryStream(bytes);
            var formFile = new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = DocxMime
            };

            var uploadResult = await _storageService.UploadAsync(formFile, $"topic-rename-requests/{request.RequestCode}");
            if (!uploadResult.Success)
                return OperationResult<TopicRenameRequestFileReadDto>.Failed(uploadResult.ErrorMessage ?? "Template upload failed", uploadResult.StatusCode);

            var currentFiles = await _uow.TopicRenameRequestFiles.Query()
                .Where(x => x.RequestId == request.RequestId && x.IsCurrent)
                .ToListAsync();
            foreach (var current in currentFiles)
            {
                current.IsCurrent = false;
                _uow.TopicRenameRequestFiles.Update(current);
            }

            var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
            var uploadedByUserId = _currentUserService.GetUserId();
            var uploadedByUserCode = _currentUserService.GetUserCode();
            var fileEntity = new TopicRenameRequestFile
            {
                FileCode = null!,
                RequestId = request.RequestId,
                FileType = "GENERATED_DOC",
                FileName = fileName,
                OriginalFileName = fileName,
                FileUrl = uploadResult.Data!,
                FilePath = uploadResult.Data!,
                StorageProvider = _storageService.IsManagedUrl(uploadResult.Data) ? "MEGA" : "LOCAL",
                MimeType = DocxMime,
                FileSize = bytes.LongLength,
                FileHash = hash,
                FileVersion = 1,
                IsCurrent = true,
                UploadedByUserId = uploadedByUserId,
                UploadedByUserCode = uploadedByUserCode,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            request.GeneratedFileUrl = uploadResult.Data!;
            request.GeneratedFileName = fileName;
            request.GeneratedFileSize = bytes.LongLength;
            request.GeneratedFileHash = hash;
            request.LastUpdated = DateTime.UtcNow;

            await _uow.TopicRenameRequestFiles.AddAsync(fileEntity);
            _uow.TopicRenameRequests.Update(request);
            await _uow.SaveChangesAsync();

            return OperationResult<TopicRenameRequestFileReadDto>.Succeeded(new TopicRenameRequestFileReadDto(
                fileEntity.FileId,
                fileEntity.FileCode,
                fileEntity.RequestId,
                fileEntity.FileType,
                fileEntity.FileName,
                fileEntity.OriginalFileName,
                fileEntity.FileUrl,
                fileEntity.FilePath,
                fileEntity.StorageProvider,
                fileEntity.MimeType,
                fileEntity.FileSize,
                fileEntity.FileHash,
                fileEntity.FileVersion,
                fileEntity.IsCurrent,
                fileEntity.UploadedByUserCode,
                fileEntity.CreatedAt,
                fileEntity.LastUpdated), 201);
        }
    }

    public class DeleteTopicRenameRequestTemplateCommand : IDeleteTopicRenameRequestTemplateCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IFileStorageService _storageService;

        public DeleteTopicRenameRequestTemplateCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<string>> ExecuteAsync(int id)
        {
            var request = await _uow.TopicRenameRequests.GetByIdAsync(id);
            if (request == null)
                return OperationResult<string>.Failed("TopicRenameRequest not found", 404);

            var files = await _uow.TopicRenameRequestFiles.Query()
                .Where(x => x.RequestId == id && x.FileType == "GENERATED_DOC")
                .ToListAsync();

            if (files.Count == 0 && string.IsNullOrWhiteSpace(request.GeneratedFileUrl))
                return OperationResult<string>.Failed("Generated template not found", 404);

            foreach (var file in files)
            {
                if (!string.IsNullOrWhiteSpace(file.FileUrl))
                    await _storageService.DeleteAsync(file.FileUrl);

                _uow.TopicRenameRequestFiles.Remove(file);
            }

            if (!string.IsNullOrWhiteSpace(request.GeneratedFileUrl))
                await _storageService.DeleteAsync(request.GeneratedFileUrl);

            request.GeneratedFileUrl = null;
            request.GeneratedFileName = null;
            request.GeneratedFileSize = null;
            request.GeneratedFileHash = null;
            request.LastUpdated = DateTime.UtcNow;

            _uow.TopicRenameRequests.Update(request);
            await _uow.SaveChangesAsync();

            return OperationResult<string>.Succeeded("Generated template deleted successfully");
        }
    }
}
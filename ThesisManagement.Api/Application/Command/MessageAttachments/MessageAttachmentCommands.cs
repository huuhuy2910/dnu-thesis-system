using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.MessageAttachments.Command;
using ThesisManagement.Api.DTOs.MessageAttachments.Query;
using ThesisManagement.Api.DTOs.Messages.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

namespace ThesisManagement.Api.Application.Command.MessageAttachments
{
    public interface ICreateMessageAttachmentCommand
    {
        Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(MessageAttachmentCreateDto dto);
    }

    public interface IUpdateMessageAttachmentCommand
    {
        Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(int id, MessageAttachmentUpdateDto dto);
    }

    public interface IUploadMessageAttachmentCommand
    {
        Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(IFormFile? file, int messageId, string? thumbnailUrl);
    }

    public interface IDeleteMessageAttachmentCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateMessageAttachmentCommand : ICreateMessageAttachmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;

        public CreateMessageAttachmentCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        public async Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(MessageAttachmentCreateDto dto)
        {
            if (dto.MessageID <= 0 || string.IsNullOrWhiteSpace(dto.FileUrl))
                return OperationResult<MessageAttachmentReadDto>.Failed("MessageID and FileUrl are required", 400);

            if (dto.FileUrl.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
                return OperationResult<MessageAttachmentReadDto>.Failed("FileUrl không hợp lệ. Vui lòng upload file qua endpoint multipart/form-data.", 400);

            var message = await _uow.Messages.GetByIdAsync(dto.MessageID);
            if (message == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Conversation not found", 404);

            var entity = new MessageAttachment
            {
                MessageID = dto.MessageID,
                FileUrl = dto.FileUrl,
                FileName = dto.FileName,
                MimeType = dto.MimeType,
                FileSizeBytes = dto.FileSizeBytes,
                ThumbnailURL = dto.ThumbnailURL,
                UploadedAt = DateTime.UtcNow
            };

            await _uow.MessageAttachments.AddAsync(entity);
            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageAttachmentReadDto>(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.attachment.created", payload);

            var messagePayload = _mapper.Map<MessageReadDto>(message);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.updated", messagePayload);

            return OperationResult<MessageAttachmentReadDto>.Succeeded(payload, 201);
        }
    }

    public class UploadMessageAttachmentCommand : IUploadMessageAttachmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IFileStorageService _storageService;

        public UploadMessageAttachmentCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, IFileStorageService storageService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _storageService = storageService;
        }

        public async Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(IFormFile? file, int messageId, string? thumbnailUrl)
        {
            if (messageId <= 0)
                return OperationResult<MessageAttachmentReadDto>.Failed("MessageID is required", 400);

            if (file == null || file.Length == 0)
                return OperationResult<MessageAttachmentReadDto>.Failed("File is required", 400);

            var message = await _uow.Messages.GetByIdAsync(messageId);
            if (message == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Conversation not found", 404);

            var uploadResult = await _storageService.UploadAsync(file, "uploads/chat");
            if (!uploadResult.Success)
                return OperationResult<MessageAttachmentReadDto>.Failed(uploadResult.ErrorMessage ?? "Upload file failed", uploadResult.StatusCode);

            var originalFileName = Path.GetFileName(file.FileName);
            var fileUrl = uploadResult.Data!;

            var entity = new MessageAttachment
            {
                MessageID = messageId,
                FileUrl = fileUrl,
                FileName = originalFileName,
                MimeType = file.ContentType,
                FileSizeBytes = file.Length,
                ThumbnailURL = string.IsNullOrWhiteSpace(thumbnailUrl) ? null : thumbnailUrl,
                UploadedAt = DateTime.UtcNow
            };

            await _uow.MessageAttachments.AddAsync(entity);
            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageAttachmentReadDto>(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.attachment.created", payload);

            var messagePayload = _mapper.Map<MessageReadDto>(message);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.updated", messagePayload);

            return OperationResult<MessageAttachmentReadDto>.Succeeded(payload, 201);
        }
    }

    public class UpdateMessageAttachmentCommand : IUpdateMessageAttachmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IFileStorageService _storageService;

        public UpdateMessageAttachmentCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, IFileStorageService storageService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _storageService = storageService;
        }

        public async Task<OperationResult<MessageAttachmentReadDto>> ExecuteAsync(int id, MessageAttachmentUpdateDto dto)
        {
            var entity = await _uow.MessageAttachments.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Message attachment not found", 404);

            var oldFileUrl = entity.FileUrl;
            if (!string.IsNullOrWhiteSpace(dto.FileUrl))
                entity.FileUrl = dto.FileUrl;
            if (dto.FileName is not null)
                entity.FileName = dto.FileName;
            if (dto.MimeType is not null)
                entity.MimeType = dto.MimeType;
            if (dto.FileSizeBytes.HasValue)
                entity.FileSizeBytes = dto.FileSizeBytes;
            if (dto.ThumbnailURL is not null)
                entity.ThumbnailURL = dto.ThumbnailURL;

            var message = await _uow.Messages.GetByIdAsync(entity.MessageID);
            if (message == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<MessageAttachmentReadDto>.Failed("Conversation not found", 404);

            _uow.MessageAttachments.Update(entity);
            await _uow.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(oldFileUrl) && !string.Equals(oldFileUrl, entity.FileUrl, StringComparison.OrdinalIgnoreCase))
            {
                await _storageService.DeleteAsync(oldFileUrl);
            }

            var payload = _mapper.Map<MessageAttachmentReadDto>(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.attachment.updated", payload);

            var messagePayload = _mapper.Map<MessageReadDto>(message);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.updated", messagePayload);

            return OperationResult<MessageAttachmentReadDto>.Succeeded(payload);
        }
    }

    public class DeleteMessageAttachmentCommand : IDeleteMessageAttachmentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _storageService;

        public DeleteMessageAttachmentCommand(IUnitOfWork uow, IHubContext<ChatHub> hubContext, IMapper mapper, IFileStorageService storageService)
        {
            _uow = uow;
            _hubContext = hubContext;
            _mapper = mapper;
            _storageService = storageService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageAttachments.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Message attachment not found", 404);

            var message = await _uow.Messages.GetByIdAsync(entity.MessageID);
            if (message == null)
                return OperationResult<object?>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<object?>.Failed("Conversation not found", 404);

            var payload = new
            {
                entity.AttachmentID,
                entity.MessageID
            };

            await _storageService.DeleteAsync(entity.FileUrl);
            _uow.MessageAttachments.Remove(entity);
            await _uow.SaveChangesAsync();

            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.attachment.deleted", payload);

            var messagePayload = _mapper.Map<MessageReadDto>(message);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.updated", messagePayload);

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

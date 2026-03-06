using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Messages.Command;
using ThesisManagement.Api.DTOs.Messages.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Messages
{
    public interface ICreateMessageCommand
    {
        Task<OperationResult<MessageReadDto>> ExecuteAsync(MessageCreateDto dto);
    }

    public interface IUpdateMessageCommand
    {
        Task<OperationResult<MessageReadDto>> ExecuteAsync(int id, MessageUpdateDto dto);
    }

    public interface IDeleteMessageCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateMessageCommand : ICreateMessageCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public CreateMessageCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReadDto>> ExecuteAsync(MessageCreateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReadDto>.Failed("Unauthorized", 401);

            if (dto.ConversationID <= 0)
                return OperationResult<MessageReadDto>.Failed("ConversationID is required", 400);

            var conversation = await _uow.Conversations.GetByIdAsync(dto.ConversationID);
            if (conversation == null || conversation.IsArchived)
                return OperationResult<MessageReadDto>.Failed("Conversation not found or archived", 404);

            var actorUser = await _uow.Users.GetByCodeAsync(actorUserCode);
            if (actorUser == null)
                return OperationResult<MessageReadDto>.Failed("User not found", 404);

            var isMember = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == dto.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null) > 0;

            if (!isMember)
                return OperationResult<MessageReadDto>.Failed("User is not an active member of this conversation", 403);

            var entity = new Message
            {
                MessageCode = Guid.NewGuid().ToString("N")[..24].ToUpperInvariant(),
                ConversationID = dto.ConversationID,
                ConversationCode = conversation.ConversationCode,
                SenderUserID = actorUser.UserID,
                SenderUserCode = actorUserCode,
                Content = dto.Content,
                MessageType = string.IsNullOrWhiteSpace(dto.MessageType) ? "TEXT" : dto.MessageType.Trim().ToUpperInvariant(),
                ReplyToMessageID = dto.ReplyToMessageID,
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await _uow.Messages.AddAsync(entity);
            conversation.LastUpdated = DateTime.UtcNow;
            _uow.Conversations.Update(conversation);

            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageReadDto>(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.created", payload);

            return OperationResult<MessageReadDto>.Succeeded(payload, 201);
        }
    }

    public class UpdateMessageCommand : IUpdateMessageCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public UpdateMessageCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReadDto>> ExecuteAsync(int id, MessageUpdateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReadDto>.Failed("Unauthorized", 401);

            var entity = await _uow.Messages.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<MessageReadDto>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(entity.ConversationID);
            if (conversation == null)
                return OperationResult<MessageReadDto>.Failed("Conversation not found", 404);

            var isOwner = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == entity.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null
                && x.MemberRole == "Owner") > 0;

            if (!string.Equals(entity.SenderUserCode, actorUserCode, StringComparison.OrdinalIgnoreCase) && !isOwner)
                return OperationResult<MessageReadDto>.Failed("Forbidden", 403);

            if (dto.Content is not null)
                entity.Content = dto.Content;
            if (!string.IsNullOrWhiteSpace(dto.MessageType))
                entity.MessageType = dto.MessageType.Trim().ToUpperInvariant();
            if (dto.IsDeleted.HasValue)
                entity.IsDeleted = dto.IsDeleted.Value;
            if (dto.EditedAt.HasValue)
                entity.EditedAt = dto.EditedAt.Value;
            if (dto.DeletedAt.HasValue)
                entity.DeletedAt = dto.DeletedAt.Value;

            _uow.Messages.Update(entity);
            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageReadDto>(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.updated", payload);

            return OperationResult<MessageReadDto>.Succeeded(payload);
        }
    }

    public class DeleteMessageCommand : IDeleteMessageCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public DeleteMessageCommand(IUnitOfWork uow, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<object?>.Failed("Unauthorized", 401);

            var entity = await _uow.Messages.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(entity.ConversationID);
            if (conversation == null)
                return OperationResult<object?>.Failed("Conversation not found", 404);

            var isOwner = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == entity.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null
                && x.MemberRole == "Owner") > 0;

            if (!string.Equals(entity.SenderUserCode, actorUserCode, StringComparison.OrdinalIgnoreCase) && !isOwner)
                return OperationResult<object?>.Failed("Forbidden", 403);

            var payload = new
            {
                entity.MessageID,
                entity.ConversationID
            };

            _uow.Messages.Remove(entity);
            await _uow.SaveChangesAsync();

            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.deleted", payload);

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

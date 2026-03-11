using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.MessageReactions.Command;
using ThesisManagement.Api.DTOs.MessageReactions.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.MessageReactions
{
    public interface ICreateMessageReactionCommand
    {
        Task<OperationResult<MessageReactionReadDto>> ExecuteAsync(MessageReactionCreateDto dto);
    }

    public interface IUpdateMessageReactionCommand
    {
        Task<OperationResult<MessageReactionReadDto>> ExecuteAsync(int id, MessageReactionUpdateDto dto);
    }

    public interface IDeleteMessageReactionCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateMessageReactionCommand : ICreateMessageReactionCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public CreateMessageReactionCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReactionReadDto>> ExecuteAsync(MessageReactionCreateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReactionReadDto>.Failed("Unauthorized", 401);

            if (dto.MessageID <= 0 || string.IsNullOrWhiteSpace(dto.ReactionType))
                return OperationResult<MessageReactionReadDto>.Failed("MessageID and ReactionType are required", 400);

            var message = await _uow.Messages.GetByIdAsync(dto.MessageID);
            if (message == null)
                return OperationResult<MessageReactionReadDto>.Failed("Message not found", 404);

            var actorUser = await _uow.Users.GetByCodeAsync(actorUserCode);
            if (actorUser == null)
                return OperationResult<MessageReactionReadDto>.Failed("User not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null || conversation.IsArchived)
                return OperationResult<MessageReactionReadDto>.Failed("Conversation not found or archived", 404);

            var isMember = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == conversation.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null) > 0;
            if (!isMember)
                return OperationResult<MessageReactionReadDto>.Failed("User is not an active member of this conversation", 403);

            var normalizedReactionType = dto.ReactionType.Trim().ToUpperInvariant();

            var existed = _uow.MessageReactions.Query().FirstOrDefault(x =>
                x.MessageID == dto.MessageID && x.UserCode == actorUserCode && x.ReactionType == normalizedReactionType);
            if (existed != null)
                return OperationResult<MessageReactionReadDto>.Succeeded(await BuildPayloadAsync(existed));

            var entity = new MessageReaction
            {
                MessageID = dto.MessageID,
                UserID = actorUser.UserID,
                UserCode = actorUserCode,
                ReactionType = normalizedReactionType,
                ReactedAt = DateTime.UtcNow
            };

            await _uow.MessageReactions.AddAsync(entity);
            await _uow.SaveChangesAsync();

            var payload = await BuildPayloadAsync(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("reaction.created", payload);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.reaction.created", payload);

            return OperationResult<MessageReactionReadDto>.Succeeded(payload, 201);
        }

        private async Task<MessageReactionReadDto> BuildPayloadAsync(MessageReaction entity)
        {
            var displayName = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode == entity.UserCode)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            var avatarUrl = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode == entity.UserCode)
                .Select(x => x.StudentImage)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == entity.UserCode)
                    .Select(x => x.FullName)
                    .FirstOrDefaultAsync();
            }

            if (string.IsNullOrWhiteSpace(avatarUrl))
            {
                avatarUrl = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == entity.UserCode)
                    .Select(x => x.ProfileImage)
                    .FirstOrDefaultAsync();
            }

            return new MessageReactionReadDto(
                entity.ReactionID,
                entity.MessageID,
                entity.UserCode,
                entity.ReactionType,
                entity.ReactedAt,
                displayName,
                avatarUrl);
        }
    }

    public class UpdateMessageReactionCommand : IUpdateMessageReactionCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public UpdateMessageReactionCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReactionReadDto>> ExecuteAsync(int id, MessageReactionUpdateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReactionReadDto>.Failed("Unauthorized", 401);

            var entity = await _uow.MessageReactions.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<MessageReactionReadDto>.Failed("Message reaction not found", 404);

            var message = await _uow.Messages.GetByIdAsync(entity.MessageID);
            if (message == null)
                return OperationResult<MessageReactionReadDto>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<MessageReactionReadDto>.Failed("Conversation not found", 404);

            var isOwner = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == conversation.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null
                && x.MemberRole == "Owner") > 0;

            if (!string.Equals(entity.UserCode, actorUserCode, StringComparison.OrdinalIgnoreCase) && !isOwner)
                return OperationResult<MessageReactionReadDto>.Failed("Forbidden", 403);

            if (!string.IsNullOrWhiteSpace(dto.ReactionType))
                entity.ReactionType = dto.ReactionType.Trim().ToUpperInvariant();

            _uow.MessageReactions.Update(entity);
            await _uow.SaveChangesAsync();

            var payload = await BuildPayloadAsync(entity);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("reaction.updated", payload);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.reaction.updated", payload);

            return OperationResult<MessageReactionReadDto>.Succeeded(payload);
        }

        private async Task<MessageReactionReadDto> BuildPayloadAsync(MessageReaction entity)
        {
            var displayName = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode == entity.UserCode)
                .Select(x => x.FullName)
                .FirstOrDefaultAsync();

            var avatarUrl = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode == entity.UserCode)
                .Select(x => x.StudentImage)
                .FirstOrDefaultAsync();

            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == entity.UserCode)
                    .Select(x => x.FullName)
                    .FirstOrDefaultAsync();
            }

            if (string.IsNullOrWhiteSpace(avatarUrl))
            {
                avatarUrl = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == entity.UserCode)
                    .Select(x => x.ProfileImage)
                    .FirstOrDefaultAsync();
            }

            return new MessageReactionReadDto(
                entity.ReactionID,
                entity.MessageID,
                entity.UserCode,
                entity.ReactionType,
                entity.ReactedAt,
                displayName,
                avatarUrl);
        }
    }

    public class DeleteMessageReactionCommand : IDeleteMessageReactionCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public DeleteMessageReactionCommand(IUnitOfWork uow, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
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

            var entity = await _uow.MessageReactions.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Message reaction not found", 404);

            var payload = new
            {
                entity.ReactionID,
                entity.MessageID,
                entity.UserCode,
                entity.ReactionType
            };

            var message = await _uow.Messages.GetByIdAsync(entity.MessageID);
            if (message == null)
                return OperationResult<object?>.Failed("Message not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation == null)
                return OperationResult<object?>.Failed("Conversation not found", 404);

            var isOwner = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == conversation.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null
                && x.MemberRole == "Owner") > 0;

            if (!string.Equals(entity.UserCode, actorUserCode, StringComparison.OrdinalIgnoreCase) && !isOwner)
                return OperationResult<object?>.Failed("Forbidden", 403);

            _uow.MessageReactions.Remove(entity);
            await _uow.SaveChangesAsync();

            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("reaction.deleted", payload);
            await _hubContext.Clients
                .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                .SendAsync("message.reaction.deleted", payload);

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Command;
using ThesisManagement.Api.DTOs.MessageReadReceipts.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.MessageReadReceipts
{
    public interface ICreateMessageReadReceiptCommand
    {
        Task<OperationResult<MessageReadReceiptReadDto>> ExecuteAsync(MessageReadReceiptCreateDto dto);
    }

    public interface IUpdateMessageReadReceiptCommand
    {
        Task<OperationResult<MessageReadReceiptReadDto>> ExecuteAsync(int id, MessageReadReceiptUpdateDto dto);
    }

    public interface IDeleteMessageReadReceiptCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateMessageReadReceiptCommand : ICreateMessageReadReceiptCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public CreateMessageReadReceiptCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReadReceiptReadDto>> ExecuteAsync(MessageReadReceiptCreateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            var actorUserId = _currentUserService.GetUserId();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReadReceiptReadDto>.Failed("Unauthorized", 401);
            if (!actorUserId.HasValue)
                return OperationResult<MessageReadReceiptReadDto>.Failed("Unauthorized", 401);

            if (dto.MessageID <= 0)
                return OperationResult<MessageReadReceiptReadDto>.Failed("MessageID is required", 400);

            var message = await _uow.Messages.GetByIdAsync(dto.MessageID);
            if (message == null)
                return OperationResult<MessageReadReceiptReadDto>.Failed("Message not found", 404);

            var isMember = _uow.ConversationMembers.Query().Count(x =>
                x.ConversationID == message.ConversationID
                && x.UserCode == actorUserCode
                && x.LeftAt == null) > 0;
            if (!isMember)
                return OperationResult<MessageReadReceiptReadDto>.Failed("User is not an active member of this conversation", 403);

            var existed = _uow.MessageReadReceipts.Query().FirstOrDefault(x => x.MessageID == dto.MessageID && x.UserCode == actorUserCode);
            if (existed != null)
            {
                existed.ReadAt = dto.ReadAt ?? DateTime.UtcNow;
                _uow.MessageReadReceipts.Update(existed);
                await _uow.SaveChangesAsync();

                var updatePayload = _mapper.Map<MessageReadReceiptReadDto>(existed);
                var updateConversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
                if (updateConversation != null)
                {
                    await _hubContext.Clients
                        .Group(ChatHubGroups.Conversation(updateConversation.ConversationCode))
                        .SendAsync("receipt.updated", updatePayload);
                }

                return OperationResult<MessageReadReceiptReadDto>.Succeeded(updatePayload);
            }

            var entity = new MessageReadReceipt
            {
                MessageID = dto.MessageID,
                UserID = actorUserId.Value,
                UserCode = actorUserCode,
                ReadAt = dto.ReadAt ?? DateTime.UtcNow
            };

            await _uow.MessageReadReceipts.AddAsync(entity);
            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageReadReceiptReadDto>(entity);
            var conversation = await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation != null)
            {
                await _hubContext.Clients
                    .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                    .SendAsync("receipt.updated", payload);
            }

            return OperationResult<MessageReadReceiptReadDto>.Succeeded(payload, 201);
        }
    }

    public class UpdateMessageReadReceiptCommand : IUpdateMessageReadReceiptCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICurrentUserService _currentUserService;

        public UpdateMessageReadReceiptCommand(IUnitOfWork uow, IMapper mapper, IHubContext<ChatHub> hubContext, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _hubContext = hubContext;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<MessageReadReceiptReadDto>> ExecuteAsync(int id, MessageReadReceiptUpdateDto dto)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<MessageReadReceiptReadDto>.Failed("Unauthorized", 401);

            var entity = await _uow.MessageReadReceipts.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<MessageReadReceiptReadDto>.Failed("Message read receipt not found", 404);

            if (!string.Equals(entity.UserCode, actorUserCode, StringComparison.OrdinalIgnoreCase))
                return OperationResult<MessageReadReceiptReadDto>.Failed("Forbidden", 403);

            entity.ReadAt = dto.ReadAt ?? DateTime.UtcNow;

            _uow.MessageReadReceipts.Update(entity);
            await _uow.SaveChangesAsync();

            var payload = _mapper.Map<MessageReadReceiptReadDto>(entity);
            var message = await _uow.Messages.GetByIdAsync(entity.MessageID);
            var conversation = message == null ? null : await _uow.Conversations.GetByIdAsync(message.ConversationID);
            if (conversation != null)
            {
                await _hubContext.Clients
                    .Group(ChatHubGroups.Conversation(conversation.ConversationCode))
                    .SendAsync("receipt.updated", payload);
            }

            return OperationResult<MessageReadReceiptReadDto>.Succeeded(payload);
        }
    }

    public class DeleteMessageReadReceiptCommand : IDeleteMessageReadReceiptCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public DeleteMessageReadReceiptCommand(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var actorUserCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<object?>.Failed("Unauthorized", 401);

            var entity = await _uow.MessageReadReceipts.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Message read receipt not found", 404);

            if (!string.Equals(entity.UserCode, actorUserCode, StringComparison.OrdinalIgnoreCase))
                return OperationResult<object?>.Failed("Forbidden", 403);

            _uow.MessageReadReceipts.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

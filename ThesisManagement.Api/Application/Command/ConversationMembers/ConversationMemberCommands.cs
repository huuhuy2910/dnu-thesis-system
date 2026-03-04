using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.ConversationMembers.Command;
using ThesisManagement.Api.DTOs.ConversationMembers.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ConversationMembers
{
    public interface ICreateConversationMemberCommand
    {
        Task<OperationResult<ConversationMemberReadDto>> ExecuteAsync(ConversationMemberCreateDto dto);
    }

    public interface IUpdateConversationMemberCommand
    {
        Task<OperationResult<ConversationMemberReadDto>> ExecuteAsync(int id, ConversationMemberUpdateDto dto);
    }

    public interface IDeleteConversationMemberCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateConversationMemberCommand : ICreateConversationMemberCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateConversationMemberCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ConversationMemberReadDto>> ExecuteAsync(ConversationMemberCreateDto dto)
        {
            if (dto.ConversationID <= 0 || string.IsNullOrWhiteSpace(dto.UserCode))
                return OperationResult<ConversationMemberReadDto>.Failed("ConversationID and UserCode are required", 400);

            var userId = dto.UserID;
            if (!userId.HasValue)
            {
                var user = await _uow.Users.GetByCodeAsync(dto.UserCode);
                userId = user?.UserID;
            }

            if (!userId.HasValue)
                return OperationResult<ConversationMemberReadDto>.Failed("User not found", 404);

            var conversation = await _uow.Conversations.GetByIdAsync(dto.ConversationID);
            if (conversation == null)
                return OperationResult<ConversationMemberReadDto>.Failed("Conversation not found", 404);

            var existed = _uow.ConversationMembers.Query().FirstOrDefault(x => x.ConversationID == dto.ConversationID && x.UserCode == dto.UserCode);
            if (existed != null)
                return OperationResult<ConversationMemberReadDto>.Succeeded(_mapper.Map<ConversationMemberReadDto>(existed));

            var entity = new ConversationMember
            {
                ConversationID = dto.ConversationID,
                ConversationCode = conversation.ConversationCode,
                UserID = userId.Value,
                UserCode = dto.UserCode,
                MemberRole = string.IsNullOrWhiteSpace(dto.MemberRole) ? "Member" : dto.MemberRole.Trim(),
                IsMuted = dto.IsMuted ?? false,
                IsPinned = dto.IsPinned ?? false,
                UnreadCount = 0,
                JoinedAt = DateTime.UtcNow
            };

            await _uow.ConversationMembers.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ConversationMemberReadDto>.Succeeded(_mapper.Map<ConversationMemberReadDto>(entity), 201);
        }
    }

    public class UpdateConversationMemberCommand : IUpdateConversationMemberCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateConversationMemberCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ConversationMemberReadDto>> ExecuteAsync(int id, ConversationMemberUpdateDto dto)
        {
            var entity = await _uow.ConversationMembers.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<ConversationMemberReadDto>.Failed("Conversation member not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.MemberRole))
                entity.MemberRole = dto.MemberRole.Trim();
            if (dto.NickName is not null)
                entity.NickName = dto.NickName;
            if (dto.IsMuted.HasValue)
                entity.IsMuted = dto.IsMuted.Value;
            if (dto.IsPinned.HasValue)
                entity.IsPinned = dto.IsPinned.Value;
            if (dto.JoinedAt.HasValue)
                entity.JoinedAt = dto.JoinedAt.Value;
            if (dto.LeftAt.HasValue)
                entity.LeftAt = dto.LeftAt.Value;
            if (dto.LastReadMessageID.HasValue)
                entity.LastReadMessageID = dto.LastReadMessageID.Value;
            if (dto.LastReadAt.HasValue)
                entity.LastReadAt = dto.LastReadAt.Value;
            if (dto.UnreadCount.HasValue)
                entity.UnreadCount = dto.UnreadCount.Value;

            _uow.ConversationMembers.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ConversationMemberReadDto>.Succeeded(_mapper.Map<ConversationMemberReadDto>(entity));
        }
    }

    public class DeleteConversationMemberCommand : IDeleteConversationMemberCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteConversationMemberCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.ConversationMembers.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Conversation member not found", 404);

            _uow.ConversationMembers.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

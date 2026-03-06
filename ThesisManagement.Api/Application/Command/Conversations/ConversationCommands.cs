using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Conversations.Command;
using ThesisManagement.Api.DTOs.Conversations.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Conversations
{
    public interface ICreateConversationCommand
    {
        Task<OperationResult<ConversationReadDto>> ExecuteAsync(ConversationCreateDto dto);
    }

    public interface IUpdateConversationCommand
    {
        Task<OperationResult<ConversationReadDto>> ExecuteAsync(int id, ConversationUpdateDto dto);
    }

    public interface IDeleteConversationCommand
    {
        Task<OperationResult<object?>> ExecuteAsync(int id);
    }

    public class CreateConversationCommand : ICreateConversationCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ICodeGenerator _codeGenerator;
        private readonly ICurrentUserService _currentUserService;

        public CreateConversationCommand(IUnitOfWork uow, IMapper mapper, ICodeGenerator codeGenerator, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _mapper = mapper;
            _codeGenerator = codeGenerator;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<ConversationReadDto>> ExecuteAsync(ConversationCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ConversationType))
                return OperationResult<ConversationReadDto>.Failed("ConversationType is required", 400);

            var currentUserId = _currentUserService.GetUserId();
            var currentUserCode = _currentUserService.GetUserCode();

            var createdByUserId = dto.CreatedByUserID ?? currentUserId;
            if (!createdByUserId.HasValue)
                return OperationResult<ConversationReadDto>.Failed("CreatedByUserID is required", 400);

            var entity = new Conversation
            {
                ConversationCode = _codeGenerator.Generate("CONV"),
                ConversationType = dto.ConversationType.Trim().ToUpperInvariant(),
                Title = dto.Title,
                CreatedByUserID = createdByUserId.Value,
                CreatedByUserCode = dto.CreatedByUserCode ?? currentUserCode,
                AvatarURL = dto.AvatarURL,
                IsArchived = dto.IsArchived ?? false,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.Conversations.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ConversationReadDto>.Succeeded(_mapper.Map<ConversationReadDto>(entity), 201);
        }
    }

    public class UpdateConversationCommand : IUpdateConversationCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateConversationCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ConversationReadDto>> ExecuteAsync(int id, ConversationUpdateDto dto)
        {
            var entity = await _uow.Conversations.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<ConversationReadDto>.Failed("Conversation not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.ConversationType))
                entity.ConversationType = dto.ConversationType.Trim().ToUpperInvariant();
            if (dto.Title is not null)
                entity.Title = dto.Title;
            if (dto.AvatarURL is not null)
                entity.AvatarURL = dto.AvatarURL;
            if (dto.IsArchived.HasValue)
                entity.IsArchived = dto.IsArchived.Value;

            entity.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;

            _uow.Conversations.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<ConversationReadDto>.Succeeded(_mapper.Map<ConversationReadDto>(entity));
        }
    }

    public class DeleteConversationCommand : IDeleteConversationCommand
    {
        private readonly IUnitOfWork _uow;

        public DeleteConversationCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<object?>> ExecuteAsync(int id)
        {
            var entity = await _uow.Conversations.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<object?>.Failed("Conversation not found", 404);

            _uow.Conversations.Remove(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<object?>.Succeeded(null);
        }
    }
}

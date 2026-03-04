using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.MessageReactions.Command;
using ThesisManagement.Api.DTOs.MessageReactions.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.MessageReactions
{
    public interface IGetMessageReactionsListQuery
    {
        Task<(IEnumerable<MessageReactionReadDto> Items, int TotalCount)> ExecuteAsync(MessageReactionFilter filter);
    }

    public interface IGetMessageReactionDetailQuery
    {
        Task<MessageReactionReadDto?> ExecuteAsync(int id);
    }

    public interface IGetMessageReactionCreateQuery
    {
        Task<MessageReactionCreateDto> ExecuteAsync();
    }

    public interface IGetMessageReactionUpdateQuery
    {
        Task<MessageReactionUpdateDto?> ExecuteAsync(int id);
    }

    public class GetMessageReactionsListQuery : IGetMessageReactionsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageReactionsListQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<(IEnumerable<MessageReactionReadDto> Items, int TotalCount)> ExecuteAsync(MessageReactionFilter filter)
        {
            var query = _uow.MessageReactions.Query();

            if (filter.MessageID.HasValue)
                query = query.Where(x => x.MessageID == filter.MessageID.Value);
            if (!string.IsNullOrWhiteSpace(filter.UserCode))
                query = query.Where(x => x.UserCode == filter.UserCode);
            if (!string.IsNullOrWhiteSpace(filter.ReactionType))
                query = query.Where(x => x.ReactionType == filter.ReactionType);

            var totalCount = await query.CountAsync();
            var entities = await query
                .OrderByDescending(x => x.ReactedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var studentMap = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode != null)
                .Select(x => new { x.UserCode, x.FullName, AvatarUrl = x.StudentImage })
                .ToListAsync();

            var lecturerMap = await _uow.LecturerProfiles.Query()
                .Where(x => x.UserCode != null)
                .Select(x => new { x.UserCode, x.FullName, AvatarUrl = x.ProfileImage })
                .ToListAsync();

            var displayByUserCode = studentMap
                .Concat(lecturerMap)
                .GroupBy(x => x.UserCode!)
                .ToDictionary(
                    g => g.Key,
                    g => g.First());

            var items = entities.Select(entity =>
            {
                displayByUserCode.TryGetValue(entity.UserCode, out var profile);
                return new MessageReactionReadDto(
                    entity.ReactionID,
                    entity.MessageID,
                    entity.UserCode,
                    entity.ReactionType,
                    entity.ReactedAt,
                    profile?.FullName,
                    profile?.AvatarUrl);
            });

            return (items, totalCount);
        }
    }

    public class GetMessageReactionDetailQuery : IGetMessageReactionDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public GetMessageReactionDetailQuery(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<MessageReactionReadDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageReactions.GetByIdAsync(id);
            if (entity == null)
                return null;

            var student = await _uow.StudentProfiles.Query()
                .Where(x => x.UserCode == entity.UserCode)
                .Select(x => new { x.FullName, AvatarUrl = x.StudentImage })
                .FirstOrDefaultAsync();

            var lecturer = student == null
                ? await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == entity.UserCode)
                    .Select(x => new { x.FullName, AvatarUrl = x.ProfileImage })
                    .FirstOrDefaultAsync()
                : null;

            return new MessageReactionReadDto(
                entity.ReactionID,
                entity.MessageID,
                entity.UserCode,
                entity.ReactionType,
                entity.ReactedAt,
                student?.FullName ?? lecturer?.FullName,
                student?.AvatarUrl ?? lecturer?.AvatarUrl);
        }
    }

    public class GetMessageReactionCreateQuery : IGetMessageReactionCreateQuery
    {
        public Task<MessageReactionCreateDto> ExecuteAsync()
            => Task.FromResult(new MessageReactionCreateDto(0, string.Empty, "LIKE"));
    }

    public class GetMessageReactionUpdateQuery : IGetMessageReactionUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetMessageReactionUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<MessageReactionUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.MessageReactions.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new MessageReactionUpdateDto(entity.ReactionType);
        }
    }
}

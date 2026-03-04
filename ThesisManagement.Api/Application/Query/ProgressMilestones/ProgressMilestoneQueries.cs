using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.ProgressMilestones.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.ProgressMilestones
{
    public interface IGetProgressMilestoneCreateQuery
    {
        Task<ProgressMilestoneCreateDto> ExecuteAsync();
    }

    public interface IGetProgressMilestoneUpdateQuery
    {
        Task<ProgressMilestoneUpdateDto?> ExecuteAsync(int topicId);
    }

    public class GetProgressMilestoneCreateQuery : IGetProgressMilestoneCreateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetProgressMilestoneCreateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<ProgressMilestoneCreateDto> ExecuteAsync()
        {
            var now = DateTime.UtcNow;
            var prefix = $"MS{now:yyyyMMdd}";
            var recent = await _uow.ProgressMilestones.Query()
                .Where(x => x.MilestoneCode != null && EF.Functions.Like(x.MilestoneCode, prefix + "%"))
                .OrderByDescending(x => x.MilestoneID)
                .Select(x => x.MilestoneCode)
                .Take(100)
                .ToListAsync();

            int maxSeq = 0;
            foreach (var code in recent)
            {
                if (string.IsNullOrWhiteSpace(code) || code.Length < prefix.Length + 3)
                    continue;

                var suffix = code.Substring(prefix.Length);
                var digits = suffix.Length >= 3 ? suffix.Substring(suffix.Length - 3) : suffix;
                if (int.TryParse(digits, out var seq) && seq > maxSeq)
                    maxSeq = seq;
            }

            var nextCode = prefix + (maxSeq + 1).ToString("D3");

            return new ProgressMilestoneCreateDto(
                nextCode,
                string.Empty,
                null,
                "MS_REG",
                1,
                null,
                "Đang thực hiện",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
        }
    }

    public class GetProgressMilestoneUpdateQuery : IGetProgressMilestoneUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetProgressMilestoneUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<ProgressMilestoneUpdateDto?> ExecuteAsync(int topicId)
        {
            var entity = await _uow.ProgressMilestones.Query()
                .Where(x => x.TopicID == topicId)
                .OrderByDescending(x => x.MilestoneID)
                .FirstOrDefaultAsync();

            if (entity == null)
                return null;

            return new ProgressMilestoneUpdateDto(
                entity.MilestoneCode,
                entity.TopicID,
                entity.TopicCode,
                entity.MilestoneTemplateCode,
                entity.Ordinal,
                entity.Deadline,
                entity.State,
                entity.StartedAt,
                entity.CompletedAt1,
                entity.CompletedAt2,
                entity.CompletedAt3,
                entity.CompletedAt4,
                entity.CompletedAt5,
                entity.CreatedAt,
                entity.LastUpdated);
        }
    }
}

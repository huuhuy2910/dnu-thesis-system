using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Topics.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Topics
{
    public interface IGetTopicCreateQuery
    {
        Task<TopicCreateDto> ExecuteAsync();
    }

    public interface IGetTopicUpdateQuery
    {
        Task<TopicUpdateDto?> ExecuteAsync(int id);
    }

    public interface ITopicCodeGenerator
    {
        Task<string> GenerateAsync();
    }

    public class TopicCodeGenerator : ITopicCodeGenerator
    {
        private readonly IUnitOfWork _uow;

        public TopicCodeGenerator(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<string> GenerateAsync()
        {
            var today = DateTime.Now.ToString("yyyyMMdd");
            var prefix = $"TOP{today}";

            var lastTopic = await _uow.Topics.Query()
                .Where(t => t.TopicCode.StartsWith(prefix))
                .OrderByDescending(t => t.TopicCode)
                .FirstOrDefaultAsync();

            var nextNumber = 1;
            if (lastTopic != null)
            {
                var lastCode = lastTopic.TopicCode;
                if (lastCode.Length > prefix.Length && int.TryParse(lastCode.Substring(prefix.Length), out var lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }

            return $"{prefix}{nextNumber:D3}";
        }
    }

    public class GetTopicCreateQuery : IGetTopicCreateQuery
    {
        private readonly ITopicCodeGenerator _topicCodeGenerator;

        public GetTopicCreateQuery(ITopicCodeGenerator topicCodeGenerator)
        {
            _topicCodeGenerator = topicCodeGenerator;
        }

        public async Task<TopicCreateDto> ExecuteAsync()
        {
            var now = DateTime.UtcNow;
            var generatedCode = await _topicCodeGenerator.GenerateAsync();

            return new TopicCreateDto(
                TopicCode: generatedCode,
                Title: string.Empty,
                Summary: null,
                Type: "SELF",
                ProposerUserID: 0,
                ProposerUserCode: string.Empty,
                ProposerStudentProfileID: null,
                ProposerStudentCode: null,
                SupervisorUserID: null,
                SupervisorUserCode: null,
                SupervisorLecturerProfileID: null,
                SupervisorLecturerCode: null,
                CatalogTopicID: null,
                CatalogTopicCode: null,
                DepartmentID: null,
                DepartmentCode: null,
                DefenseTermId: null,
                Score: null,
                Status: "DRAFT",
                ResubmitCount: 0,
                CreatedAt: now,
                LastUpdated: now,
                LecturerComment: null
            );
        }
    }

    public class GetTopicUpdateQuery : IGetTopicUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetTopicUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<TopicUpdateDto?> ExecuteAsync(int id)
        {
            var entity = await _uow.Topics.GetByIdAsync(id);
            if (entity == null)
                return null;

            return new TopicUpdateDto(
                Title: entity.Title,
                Summary: entity.Summary,
                Type: entity.Type,
                ProposerUserID: entity.ProposerUserID,
                ProposerUserCode: entity.ProposerUserCode,
                ProposerStudentProfileID: entity.ProposerStudentProfileID,
                ProposerStudentCode: entity.ProposerStudentCode,
                SupervisorUserID: entity.SupervisorUserID,
                SupervisorUserCode: entity.SupervisorUserCode,
                SupervisorLecturerProfileID: entity.SupervisorLecturerProfileID,
                SupervisorLecturerCode: entity.SupervisorLecturerCode,
                CatalogTopicID: entity.CatalogTopicID,
                CatalogTopicCode: entity.CatalogTopicCode,
                DepartmentID: entity.DepartmentID,
                DepartmentCode: entity.DepartmentCode,
                DefenseTermId: entity.DefenseTermId,
                Score: entity.Score,
                Status: entity.Status,
                ResubmitCount: entity.ResubmitCount,
                CreatedAt: entity.CreatedAt,
                LastUpdated: entity.LastUpdated,
                LecturerComment: entity.LecturerComment
            );
        }
    }
}

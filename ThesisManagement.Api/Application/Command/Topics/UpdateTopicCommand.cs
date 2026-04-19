using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Topics.Command;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.Chat;

namespace ThesisManagement.Api.Application.Command.Topics
{
    public interface IUpdateTopicCommand
    {
        Task<OperationResult<TopicReadDto>> ExecuteAsync(int id, TopicUpdateDto dto);
    }

    public class UpdateTopicCommand : IUpdateTopicCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IChatProvisionService _chatProvisionService;

        public UpdateTopicCommand(IUnitOfWork uow, IMapper mapper, IChatProvisionService chatProvisionService)
        {
            _uow = uow;
            _mapper = mapper;
            _chatProvisionService = chatProvisionService;
        }

        public async Task<OperationResult<TopicReadDto>> ExecuteAsync(int id, TopicUpdateDto dto)
        {
            var entity = await _uow.Topics.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<TopicReadDto>.Failed("Topic not found", 404);

            var previousStatus = entity.Status;

            if (!string.IsNullOrWhiteSpace(dto.Title))
                entity.Title = dto.Title;
            if (dto.Summary is not null)
                entity.Summary = dto.Summary;
            if (!string.IsNullOrWhiteSpace(dto.Type))
                entity.Type = dto.Type;
            if (dto.ProposerUserID.HasValue)
                entity.ProposerUserID = dto.ProposerUserID.Value;
            if (dto.ProposerUserCode is not null)
                entity.ProposerUserCode = dto.ProposerUserCode;
            if (dto.ProposerStudentProfileID.HasValue)
                entity.ProposerStudentProfileID = dto.ProposerStudentProfileID.Value;
            if (dto.ProposerStudentCode is not null)
                entity.ProposerStudentCode = dto.ProposerStudentCode;
            if (dto.SupervisorUserID.HasValue)
                entity.SupervisorUserID = dto.SupervisorUserID.Value;
            if (dto.SupervisorUserCode is not null)
                entity.SupervisorUserCode = dto.SupervisorUserCode;
            if (dto.SupervisorLecturerProfileID.HasValue)
                entity.SupervisorLecturerProfileID = dto.SupervisorLecturerProfileID.Value;
            if (dto.SupervisorLecturerCode is not null)
                entity.SupervisorLecturerCode = dto.SupervisorLecturerCode;

            if (dto.CatalogTopicCode is not null)
            {
                if (string.IsNullOrWhiteSpace(dto.CatalogTopicCode))
                {
                    entity.CatalogTopicID = null;
                    entity.CatalogTopicCode = null;
                }
                else
                {
                    var catalog = await _uow.CatalogTopics.GetByCodeAsync(dto.CatalogTopicCode);
                    if (catalog == null)
                        return OperationResult<TopicReadDto>.Failed($"Catalog topic code '{dto.CatalogTopicCode}' không tồn tại", 400);

                    entity.CatalogTopicID = catalog.CatalogTopicID;
                    entity.CatalogTopicCode = catalog.CatalogTopicCode;
                }
            }
            else if (dto.CatalogTopicID.HasValue)
            {
                var catalog = await _uow.CatalogTopics.GetByIdAsync(dto.CatalogTopicID.Value);
                if (catalog == null)
                    return OperationResult<TopicReadDto>.Failed($"Catalog topic ID '{dto.CatalogTopicID.Value}' không tồn tại", 400);

                entity.CatalogTopicID = catalog.CatalogTopicID;
                entity.CatalogTopicCode = catalog.CatalogTopicCode;
            }

            if (dto.DepartmentID.HasValue)
                entity.DepartmentID = dto.DepartmentID.Value;
            if (dto.DepartmentCode is not null)
                entity.DepartmentCode = dto.DepartmentCode;

            if (dto.DefenseTermId.HasValue)
            {
                if (dto.DefenseTermId.Value <= 0)
                {
                    entity.DefenseTermId = null;
                }
                else
                {
                    var defenseTerm = await _uow.DefenseTerms.GetByIdAsync(dto.DefenseTermId.Value);
                    if (defenseTerm == null)
                        return OperationResult<TopicReadDto>.Failed($"DefenseTerm ID '{dto.DefenseTermId.Value}' không tồn tại", 400);

                    entity.DefenseTermId = dto.DefenseTermId.Value;
                }
            }

            if (dto.Score.HasValue)
                entity.Score = dto.Score.Value;

            if (dto.Status is not null)
                entity.Status = dto.Status;
            if (dto.ResubmitCount.HasValue)
                entity.ResubmitCount = dto.ResubmitCount.Value;
            if (dto.LecturerComment is not null)
                entity.LecturerComment = dto.LecturerComment;
            if (dto.CreatedAt.HasValue)
                entity.CreatedAt = dto.CreatedAt.Value;

            entity.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;

            if (string.Equals(entity.Type, "SELF", StringComparison.OrdinalIgnoreCase))
            {
                entity.CatalogTopicID = null;
                entity.CatalogTopicCode = null;
            }

            _uow.Topics.Update(entity);
            await _uow.SaveChangesAsync();

            if (IsTransitionedToAccepted(previousStatus, entity.Status))
            {
                await _chatProvisionService.EnsureForAcceptedTopicAsync(entity);
            }

            return OperationResult<TopicReadDto>.Succeeded(_mapper.Map<TopicReadDto>(entity));
        }

        private static bool IsTransitionedToAccepted(string? previousStatus, string? currentStatus)
        {
            return !IsAcceptedStatus(previousStatus) && IsAcceptedStatus(currentStatus);
        }

        private static bool IsAcceptedStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return false;

            return status.Equals("APPROVED", StringComparison.OrdinalIgnoreCase)
                   || status.Equals("ACCEPTED", StringComparison.OrdinalIgnoreCase)
                   || status.Equals("ĐÃ DUYỆT", StringComparison.OrdinalIgnoreCase)
                   || status.Equals("Đã duyệt", StringComparison.OrdinalIgnoreCase);
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Query.Topics;
using ThesisManagement.Api.Application.Validate.Topics;
using ThesisManagement.Api.DTOs.Topics.Command;
using ThesisManagement.Api.DTOs.Topics.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Topics
{
    public interface ICreateTopicCommand
    {
        Task<OperationResult<TopicReadDto>> ExecuteAsync(TopicCreateDto dto);
    }

    public class CreateTopicCommand : ICreateTopicCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly ITopicCodeGenerator _topicCodeGenerator;

        public CreateTopicCommand(IUnitOfWork uow, IMapper mapper, ITopicCodeGenerator topicCodeGenerator)
        {
            _uow = uow;
            _mapper = mapper;
            _topicCodeGenerator = topicCodeGenerator;
        }

        public async Task<OperationResult<TopicReadDto>> ExecuteAsync(TopicCreateDto dto)
        {
            var validationError = TopicCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<TopicReadDto>.Failed(validationError, 400);

            var code = string.IsNullOrWhiteSpace(dto.TopicCode)
                ? await _topicCodeGenerator.GenerateAsync()
                : dto.TopicCode;

            var entity = new Topic
            {
                TopicCode = code,
                Title = dto.Title,
                Summary = dto.Summary,
                Type = dto.Type,
                ProposerUserID = dto.ProposerUserID,
                ProposerUserCode = dto.ProposerUserCode,
                ProposerStudentProfileID = dto.ProposerStudentProfileID,
                ProposerStudentCode = dto.ProposerStudentCode,
                SupervisorUserID = dto.SupervisorUserID,
                SupervisorUserCode = dto.SupervisorUserCode,
                SupervisorLecturerProfileID = dto.SupervisorLecturerProfileID,
                SupervisorLecturerCode = dto.SupervisorLecturerCode,
                CatalogTopicID = dto.CatalogTopicID,
                CatalogTopicCode = dto.CatalogTopicCode,
                DepartmentID = dto.DepartmentID,
                DepartmentCode = dto.DepartmentCode,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "DRAFT" : dto.Status,
                ResubmitCount = dto.ResubmitCount ?? 0,
                CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
                LastUpdated = dto.LastUpdated == default ? DateTime.UtcNow : dto.LastUpdated,
                LecturerComment = dto.LecturerComment
            };

            if (string.Equals(dto.Type, "SELF", StringComparison.OrdinalIgnoreCase))
            {
                entity.CatalogTopicID = null;
                entity.CatalogTopicCode = null;
            }

            await _uow.Topics.AddAsync(entity);

            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                entity.TopicCode = await _topicCodeGenerator.GenerateAsync();
                await _uow.SaveChangesAsync();
            }

            return OperationResult<TopicReadDto>.Succeeded(_mapper.Map<TopicReadDto>(entity), 201);
        }
    }
}

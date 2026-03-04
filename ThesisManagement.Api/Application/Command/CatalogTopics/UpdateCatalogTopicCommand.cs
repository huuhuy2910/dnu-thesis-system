using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.CatalogTopics;
using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopics
{
    public interface IUpdateCatalogTopicCommand
    {
        Task<OperationResult<CatalogTopicReadDto>> ExecuteAsync(string code, CatalogTopicUpdateDto dto);
    }

    public class UpdateCatalogTopicCommand : IUpdateCatalogTopicCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateCatalogTopicCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<CatalogTopicReadDto>> ExecuteAsync(string code, CatalogTopicUpdateDto dto)
        {
            var validationError = CatalogTopicCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CatalogTopicReadDto>.Failed(validationError, 400);

            var entity = await _uow.CatalogTopics.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<CatalogTopicReadDto>.Failed("CatalogTopic not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.Title))
                entity.Title = dto.Title.Trim();

            entity.Summary = dto.Summary;

            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                var department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                entity.DepartmentID = department?.DepartmentID;
                entity.DepartmentCode = dto.DepartmentCode;
            }

            entity.AssignedStatus = dto.AssignedStatus;
            entity.AssignedAt = dto.AssignedAt;
            entity.LastUpdated = DateTime.UtcNow;

            _uow.CatalogTopics.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<CatalogTopicReadDto>.Succeeded(_mapper.Map<CatalogTopicReadDto>(entity));
        }
    }
}

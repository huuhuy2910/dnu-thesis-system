using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.CatalogTopics;
using ThesisManagement.Api.DTOs.CatalogTopics.Command;
using ThesisManagement.Api.DTOs.CatalogTopics.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.CatalogTopics
{
    public interface ICreateCatalogTopicCommand
    {
        Task<OperationResult<CatalogTopicReadDto>> ExecuteAsync(CatalogTopicCreateDto dto);
    }

    public class CreateCatalogTopicCommand : ICreateCatalogTopicCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateCatalogTopicCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<CatalogTopicReadDto>> ExecuteAsync(CatalogTopicCreateDto dto)
        {
            var validationError = CatalogTopicCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<CatalogTopicReadDto>.Failed(validationError, 400);

            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query()
                    .FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }

            var entity = new CatalogTopic
            {
                CatalogTopicCode = _codeGenerator.Generate("CAT"),
                Title = dto.Title.Trim(),
                Summary = dto.Summary,
                DepartmentID = department?.DepartmentID,
                DepartmentCode = dto.DepartmentCode,
                AssignedStatus = dto.AssignedStatus,
                AssignedAt = dto.AssignedAt,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.CatalogTopics.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<CatalogTopicReadDto>.Succeeded(_mapper.Map<CatalogTopicReadDto>(entity), 201);
        }
    }
}

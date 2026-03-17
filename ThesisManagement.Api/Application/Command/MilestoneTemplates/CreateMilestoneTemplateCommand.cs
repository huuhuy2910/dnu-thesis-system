using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.MilestoneTemplates;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Command;
using ThesisManagement.Api.DTOs.MilestoneTemplates.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.MilestoneTemplates
{
    public interface ICreateMilestoneTemplateCommand
    {
        Task<OperationResult<MilestoneTemplateReadDto>> ExecuteAsync(MilestoneTemplateCreateDto dto);
    }

    public class CreateMilestoneTemplateCommand : ICreateMilestoneTemplateCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateMilestoneTemplateCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<MilestoneTemplateReadDto>> ExecuteAsync(MilestoneTemplateCreateDto dto)
        {
            var validationError = MilestoneTemplateCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<MilestoneTemplateReadDto>.Failed(validationError, 400);

            var code = string.IsNullOrWhiteSpace(dto.MilestoneTemplateCode)
                ? _codeGenerator.Generate("MTPL")
                : dto.MilestoneTemplateCode.Trim();

            var entity = new MilestoneTemplate
            {
                MilestoneTemplateCode = code,
                Name = dto.Name.Trim(),
                Description = dto.Description,
                Ordinal = dto.Ordinal,
                Deadline = dto.Deadline,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.MilestoneTemplates.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<MilestoneTemplateReadDto>.Succeeded(_mapper.Map<MilestoneTemplateReadDto>(entity), 201);
        }
    }
}

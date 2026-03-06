using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.DefenseScores;
using ThesisManagement.Api.DTOs.DefenseScores.Command;
using ThesisManagement.Api.DTOs.DefenseScores.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseScores
{
    public interface ICreateDefenseScoreCommand
    {
        Task<OperationResult<DefenseScoreReadDto>> ExecuteAsync(DefenseScoreCreateDto dto);
    }

    public class CreateDefenseScoreCommand : ICreateDefenseScoreCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateDefenseScoreCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseScoreReadDto>> ExecuteAsync(DefenseScoreCreateDto dto)
        {
            var validationError = DefenseScoreCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DefenseScoreReadDto>.Failed(validationError, 400);

            var entity = new DefenseScore
            {
                ScoreCode = _codeGenerator.Generate("SCORE"),
                AssignmentCode = dto.AssignmentCode,
                MemberLecturerUserCode = dto.MemberLecturerUserCode,
                MemberLecturerCode = dto.MemberLecturerCode,
                Score = dto.Score,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.DefenseScores.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DefenseScoreReadDto>.Succeeded(_mapper.Map<DefenseScoreReadDto>(entity), 201);
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.DefenseScores;
using ThesisManagement.Api.DTOs.DefenseScores.Command;
using ThesisManagement.Api.DTOs.DefenseScores.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseScores
{
    public interface IUpdateDefenseScoreCommand
    {
        Task<OperationResult<DefenseScoreReadDto>> ExecuteAsync(int id, DefenseScoreUpdateDto dto);
    }

    public class UpdateDefenseScoreCommand : IUpdateDefenseScoreCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateDefenseScoreCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseScoreReadDto>> ExecuteAsync(int id, DefenseScoreUpdateDto dto)
        {
            var validationError = DefenseScoreCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DefenseScoreReadDto>.Failed(validationError, 400);

            var entity = await _uow.DefenseScores.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<DefenseScoreReadDto>.Failed("Score not found", 404);

            entity.Score = dto.Score ?? entity.Score;
            entity.Comment = dto.Comment ?? entity.Comment;
            entity.LastUpdated = DateTime.UtcNow;

            _uow.DefenseScores.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<DefenseScoreReadDto>.Succeeded(_mapper.Map<DefenseScoreReadDto>(entity));
        }
    }
}

using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressSubmissions
{
    public interface IUpdateProgressSubmissionCommand
    {
        Task<OperationResult<ProgressSubmissionReadDto>> ExecuteAsync(int id, ProgressSubmissionUpdateDto dto);
    }

    public class UpdateProgressSubmissionCommand : IUpdateProgressSubmissionCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateProgressSubmissionCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ProgressSubmissionReadDto>> ExecuteAsync(int id, ProgressSubmissionUpdateDto dto)
        {
            var ent = await _uow.ProgressSubmissions.GetByIdAsync(id);
            if (ent == null)
                return OperationResult<ProgressSubmissionReadDto>.Failed("Submission not found", 404);

            ent.LecturerComment = dto.LecturerComment ?? ent.LecturerComment;
            ent.LecturerState = dto.LecturerState ?? ent.LecturerState;
            ent.FeedbackLevel = dto.FeedbackLevel ?? ent.FeedbackLevel;
            ent.LastUpdated = DateTime.UtcNow;
            _uow.ProgressSubmissions.Update(ent);
            await _uow.SaveChangesAsync();
            return OperationResult<ProgressSubmissionReadDto>.Succeeded(_mapper.Map<ProgressSubmissionReadDto>(ent));
        }
    }
}

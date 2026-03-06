using AutoMapper;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.LecturerTags;
using ThesisManagement.Api.DTOs.LecturerTags.Command;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerTags
{
    public interface IUpdateLecturerTagCommand
    {
        Task<OperationResult<LecturerTagReadDto>> ExecuteAsync(int id, LecturerTagUpdateDto dto);
    }

    public class UpdateLecturerTagCommand : IUpdateLecturerTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateLecturerTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<LecturerTagReadDto>> ExecuteAsync(int id, LecturerTagUpdateDto dto)
        {
            var validationError = LecturerTagCommandValidator.ValidateUpdate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LecturerTagReadDto>.Failed(validationError, 400);

            var ent = await _uow.LecturerTags.GetByIdAsync(id);
            if (ent == null)
                return OperationResult<LecturerTagReadDto>.Failed("LecturerTag not found", 404);

            if (dto.LecturerProfileID.HasValue) ent.LecturerProfileID = dto.LecturerProfileID.Value;
            if (dto.LecturerCode is not null) ent.LecturerCode = dto.LecturerCode;
            if (dto.TagID.HasValue) ent.TagID = dto.TagID.Value;
            if (dto.TagCode is not null) ent.TagCode = dto.TagCode;
            if (dto.AssignedAt.HasValue) ent.AssignedAt = dto.AssignedAt.Value;
            if (dto.AssignedByUserID.HasValue) ent.AssignedByUserID = dto.AssignedByUserID.Value;
            if (dto.AssignedByUserCode is not null) ent.AssignedByUserCode = dto.AssignedByUserCode;

            _uow.LecturerTags.Update(ent);
            await _uow.SaveChangesAsync();
            return OperationResult<LecturerTagReadDto>.Succeeded(_mapper.Map<LecturerTagReadDto>(ent));
        }
    }
}

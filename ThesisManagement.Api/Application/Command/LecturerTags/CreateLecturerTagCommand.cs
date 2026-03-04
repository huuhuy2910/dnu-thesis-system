using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.LecturerTags;
using ThesisManagement.Api.DTOs.LecturerTags.Command;
using ThesisManagement.Api.DTOs.LecturerTags.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerTags
{
    public interface ICreateLecturerTagCommand
    {
        Task<OperationResult<LecturerTagReadDto>> ExecuteAsync(LecturerTagCreateDto dto);
    }

    public class CreateLecturerTagCommand : ICreateLecturerTagCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateLecturerTagCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<LecturerTagReadDto>> ExecuteAsync(LecturerTagCreateDto dto)
        {
            var validationError = LecturerTagCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LecturerTagReadDto>.Failed(validationError, 400);

            var lecturerProfileId = dto.LecturerProfileID;
            if (lecturerProfileId == 0 && !string.IsNullOrWhiteSpace(dto.LecturerCode))
            {
                var lecturer = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(x => x.LecturerCode == dto.LecturerCode);
                if (lecturer == null)
                    return OperationResult<LecturerTagReadDto>.Failed($"LecturerProfile with code '{dto.LecturerCode}' not found", 404);
                lecturerProfileId = lecturer.LecturerProfileID;
            }

            var tagId = dto.TagID;
            if (tagId == 0 && !string.IsNullOrWhiteSpace(dto.TagCode))
            {
                var tag = await _uow.Tags.Query().FirstOrDefaultAsync(x => x.TagCode == dto.TagCode);
                if (tag == null)
                    return OperationResult<LecturerTagReadDto>.Failed($"Tag with code '{dto.TagCode}' not found", 404);
                tagId = tag.TagID;
            }

            var existing = await _uow.LecturerTags.Query().FirstOrDefaultAsync(x => x.LecturerProfileID == lecturerProfileId && x.TagID == tagId);
            if (existing != null)
                return OperationResult<LecturerTagReadDto>.Failed("This lecturer already has this tag assigned", 400);

            var entity = new LecturerTag
            {
                LecturerProfileID = lecturerProfileId,
                LecturerCode = dto.LecturerCode,
                TagID = tagId,
                TagCode = dto.TagCode,
                AssignedAt = dto.AssignedAt ?? DateTime.UtcNow,
                AssignedByUserID = dto.AssignedByUserID,
                AssignedByUserCode = dto.AssignedByUserCode
            };

            await _uow.LecturerTags.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<LecturerTagReadDto>.Succeeded(_mapper.Map<LecturerTagReadDto>(entity));
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTermStudents
{
    public interface IUpdateDefenseTermStudentCommand
    {
        Task<OperationResult<DefenseTermStudentReadDto>> ExecuteAsync(int id, DefenseTermStudentUpdateDto dto);
    }

    public class UpdateDefenseTermStudentCommand : IUpdateDefenseTermStudentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateDefenseTermStudentCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseTermStudentReadDto>> ExecuteAsync(int id, DefenseTermStudentUpdateDto dto)
        {
            var entity = await _uow.DefenseTermStudents.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("DefenseTermStudent not found", 404);

            var defenseTermId = dto.DefenseTermId ?? entity.DefenseTermId;
            var defenseTerm = await _uow.DefenseTerms.GetByIdAsync(defenseTermId);
            if (defenseTerm == null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("DefenseTerm not found", 404);

            var student = await ResolveStudentProfileAsync(dto, entity);
            if (student == null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("Student profile not found", 404);

            var userCode = await ResolveUserCodeAsync(dto.UserCode, student, entity.UserCode);
            if (string.IsNullOrWhiteSpace(userCode))
                return OperationResult<DefenseTermStudentReadDto>.Failed("Student user code is required", 400);

            var duplicate = await _uow.DefenseTermStudents.Query()
                .FirstOrDefaultAsync(x => x.DefenseTermId == defenseTermId && x.StudentProfileID == student.StudentProfileID && x.DefenseTermStudentID != id);
            if (duplicate != null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("This student is already assigned to the defense term", 400);

            entity.DefenseTermId = defenseTermId;
            entity.StudentProfileID = student.StudentProfileID;
            entity.StudentCode = student.StudentCode;
            entity.UserCode = userCode.Trim();
            entity.CreatedAt = dto.CreatedAt ?? entity.CreatedAt;
            entity.LastUpdated = dto.LastUpdated ?? DateTime.UtcNow;
            entity.StudentProfile = student;
            entity.DefenseTerm = defenseTerm;

            _uow.DefenseTermStudents.Update(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<DefenseTermStudentReadDto>.Succeeded(_mapper.Map<DefenseTermStudentReadDto>(entity));
        }

        private async Task<StudentProfile?> ResolveStudentProfileAsync(DefenseTermStudentUpdateDto dto, DefenseTermStudent entity)
        {
            if (dto.StudentProfileID.HasValue)
                return await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentProfileID == dto.StudentProfileID.Value);

            if (!string.IsNullOrWhiteSpace(dto.StudentCode))
            {
                var studentCode = dto.StudentCode.Trim();
                return await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentCode == studentCode);
            }

            return await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentProfileID == entity.StudentProfileID);
        }

        private async Task<string?> ResolveUserCodeAsync(string? requestedUserCode, StudentProfile student, string existingUserCode)
        {
            if (!string.IsNullOrWhiteSpace(requestedUserCode))
                return requestedUserCode.Trim();

            if (!string.IsNullOrWhiteSpace(student.UserCode))
                return student.UserCode.Trim();

            if (student.UserID > 0)
            {
                var user = await _uow.Users.GetByIdAsync(student.UserID);
                if (user != null && !string.IsNullOrWhiteSpace(user.UserCode))
                    return user.UserCode.Trim();
            }

            return existingUserCode;
        }
    }
}
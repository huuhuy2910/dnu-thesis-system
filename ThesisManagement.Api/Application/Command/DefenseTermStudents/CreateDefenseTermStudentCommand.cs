using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.DefenseTermStudents;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Command;
using ThesisManagement.Api.DTOs.DefenseTermStudents.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefenseTermStudents
{
    public interface ICreateDefenseTermStudentCommand
    {
        Task<OperationResult<DefenseTermStudentReadDto>> ExecuteAsync(DefenseTermStudentCreateDto dto);
    }

    public class CreateDefenseTermStudentCommand : ICreateDefenseTermStudentCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateDefenseTermStudentCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<DefenseTermStudentReadDto>> ExecuteAsync(DefenseTermStudentCreateDto dto)
        {
            var validationError = DefenseTermStudentCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<DefenseTermStudentReadDto>.Failed(validationError, 400);

            var defenseTerm = await _uow.DefenseTerms.GetByIdAsync(dto.DefenseTermId);
            if (defenseTerm == null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("DefenseTerm not found", 404);

            var student = await ResolveStudentProfileAsync(dto);
            if (student == null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("Student profile not found", 404);

            var userCode = await ResolveUserCodeAsync(dto.UserCode, student);
            if (string.IsNullOrWhiteSpace(userCode))
                return OperationResult<DefenseTermStudentReadDto>.Failed("Student user code is required", 400);

            var duplicate = await _uow.DefenseTermStudents.Query()
                .FirstOrDefaultAsync(x => x.DefenseTermId == dto.DefenseTermId && x.StudentProfileID == student.StudentProfileID);
            if (duplicate != null)
                return OperationResult<DefenseTermStudentReadDto>.Failed("This student is already assigned to the defense term", 400);

            var createdAt = dto.CreatedAt ?? DateTime.UtcNow;
            var entity = new DefenseTermStudent
            {
                DefenseTermId = dto.DefenseTermId,
                StudentProfileID = student.StudentProfileID,
                StudentCode = student.StudentCode,
                UserCode = userCode.Trim(),
                CreatedAt = createdAt,
                LastUpdated = dto.LastUpdated ?? createdAt,
                DefenseTerm = defenseTerm,
                StudentProfile = student
            };

            await _uow.DefenseTermStudents.AddAsync(entity);
            await _uow.SaveChangesAsync();
            return OperationResult<DefenseTermStudentReadDto>.Succeeded(_mapper.Map<DefenseTermStudentReadDto>(entity));
        }

        private async Task<StudentProfile?> ResolveStudentProfileAsync(DefenseTermStudentCreateDto dto)
        {
            if (dto.StudentProfileID.HasValue)
                return await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentProfileID == dto.StudentProfileID.Value);

            if (!string.IsNullOrWhiteSpace(dto.StudentCode))
            {
                var studentCode = dto.StudentCode.Trim();
                return await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentCode == studentCode);
            }

            return null;
        }

        private async Task<string?> ResolveUserCodeAsync(string? requestedUserCode, StudentProfile student)
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

            return null;
        }
    }
}
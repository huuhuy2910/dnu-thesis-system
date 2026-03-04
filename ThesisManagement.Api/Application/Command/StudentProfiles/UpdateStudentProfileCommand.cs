using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.StudentProfiles.Command;
using ThesisManagement.Api.DTOs.StudentProfiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.StudentProfiles
{
    public interface IUpdateStudentProfileCommand
    {
        Task<OperationResult<StudentProfileReadDto>> ExecuteAsync(string code, StudentProfileUpdateDto dto);
    }

    public class UpdateStudentProfileCommand : IUpdateStudentProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateStudentProfileCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<StudentProfileReadDto>> ExecuteAsync(string code, StudentProfileUpdateDto dto)
        {
            var entity = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<StudentProfileReadDto>.Failed("StudentProfile not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.UserCode) && !string.Equals(dto.UserCode, entity.UserCode, StringComparison.OrdinalIgnoreCase))
            {
                var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
                if (user == null)
                    return OperationResult<StudentProfileReadDto>.Failed("User not found", 400);

                entity.UserCode = user.UserCode;
                entity.UserID = user.UserID;
            }

            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                if (department == null)
                    return OperationResult<StudentProfileReadDto>.Failed("Department not found", 400);
            }

            entity.DepartmentCode = dto.DepartmentCode;
            entity.DepartmentID = department?.DepartmentID;
            entity.ClassCode = dto.ClassCode;
            entity.FacultyCode = dto.FacultyCode;
            entity.GPA = dto.GPA;
            entity.AcademicStanding = dto.AcademicStanding;
            entity.Gender = dto.Gender;
            entity.DateOfBirth = dto.DateOfBirth;
            entity.PhoneNumber = dto.PhoneNumber;
            entity.StudentEmail = dto.StudentEmail;
            entity.Address = dto.Address;
            entity.EnrollmentYear = dto.EnrollmentYear;
            entity.Status = dto.Status;
            entity.GraduationYear = dto.GraduationYear;
            entity.Notes = dto.Notes;

            if (dto.FullName != null)
                entity.FullName = dto.FullName;

            entity.LastUpdated = DateTime.UtcNow;

            _uow.StudentProfiles.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<StudentProfileReadDto>.Succeeded(_mapper.Map<StudentProfileReadDto>(entity));
        }
    }
}

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.StudentProfiles;
using ThesisManagement.Api.DTOs.StudentProfiles.Command;
using ThesisManagement.Api.DTOs.StudentProfiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.StudentProfiles
{
    public interface ICreateStudentProfileCommand
    {
        Task<OperationResult<StudentProfileReadDto>> ExecuteAsync(StudentProfileCreateDto dto);
    }

    public class CreateStudentProfileCommand : ICreateStudentProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateStudentProfileCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<StudentProfileReadDto>> ExecuteAsync(StudentProfileCreateDto dto)
        {
            var validationError = StudentProfileCommandValidator.ValidateCreate(dto.UserCode);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<StudentProfileReadDto>.Failed(validationError, 400);

            var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
            if (user == null)
                return OperationResult<StudentProfileReadDto>.Failed("User not found", 400);

            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }

            var entity = new StudentProfile
            {
                StudentCode = _codeGenerator.Generate("STU"),
                UserCode = dto.UserCode,
                UserID = user.UserID,
                DepartmentCode = dto.DepartmentCode,
                DepartmentID = department?.DepartmentID,
                ClassCode = dto.ClassCode,
                FacultyCode = dto.FacultyCode,
                StudentImage = dto.StudentImage,
                GPA = dto.GPA,
                AcademicStanding = dto.AcademicStanding,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                PhoneNumber = dto.PhoneNumber,
                StudentEmail = dto.StudentEmail,
                Address = dto.Address,
                EnrollmentYear = dto.EnrollmentYear,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Đang học" : dto.Status,
                GraduationYear = dto.GraduationYear,
                Notes = dto.Notes,
                FullName = dto.FullName,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.StudentProfiles.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<StudentProfileReadDto>.Succeeded(_mapper.Map<StudentProfileReadDto>(entity), 201);
        }
    }
}

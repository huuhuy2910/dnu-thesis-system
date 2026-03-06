using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.LecturerProfiles;
using ThesisManagement.Api.DTOs.LecturerProfiles.Command;
using ThesisManagement.Api.DTOs.LecturerProfiles.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerProfiles
{
    public interface ICreateLecturerProfileCommand
    {
        Task<OperationResult<LecturerProfileReadDto>> ExecuteAsync(LecturerProfileCreateDto dto);
    }

    public class CreateLecturerProfileCommand : ICreateLecturerProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly IMapper _mapper;

        public CreateLecturerProfileCommand(IUnitOfWork uow, ICodeGenerator codeGenerator, IMapper mapper)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _mapper = mapper;
        }

        public async Task<OperationResult<LecturerProfileReadDto>> ExecuteAsync(LecturerProfileCreateDto dto)
        {
            var validationError = LecturerProfileCommandValidator.ValidateCreate(dto.UserCode);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LecturerProfileReadDto>.Failed(validationError, 400);

            var user = await _uow.Users.Query().FirstOrDefaultAsync(u => u.UserCode == dto.UserCode);
            if (user == null)
                return OperationResult<LecturerProfileReadDto>.Failed("User not found", 400);

            Department? department = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
            }

            var entity = new LecturerProfile
            {
                LecturerCode = _codeGenerator.Generate("LEC"),
                UserCode = dto.UserCode,
                UserID = user.UserID,
                DepartmentCode = dto.DepartmentCode,
                DepartmentID = department?.DepartmentID,
                Degree = dto.Degree,
                GuideQuota = dto.GuideQuota ?? 10,
                DefenseQuota = dto.DefenseQuota ?? 8,
                CurrentGuidingCount = dto.CurrentGuidingCount,
                Gender = dto.Gender,
                DateOfBirth = dto.DateOfBirth,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                ProfileImage = dto.ProfileImage,
                Address = dto.Address,
                Notes = dto.Notes,
                FullName = dto.FullName,
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            await _uow.LecturerProfiles.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<LecturerProfileReadDto>.Succeeded(_mapper.Map<LecturerProfileReadDto>(entity), 201);
        }
    }
}

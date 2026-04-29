using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.LecturerProfiles.Command;
using ThesisManagement.Api.DTOs.LecturerProfiles.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerProfiles
{
    public interface IUpdateLecturerProfileCommand
    {
        Task<OperationResult<LecturerProfileReadDto>> ExecuteAsync(string code, LecturerProfileUpdateDto dto);
    }

    public class UpdateLecturerProfileCommand : IUpdateLecturerProfileCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public UpdateLecturerProfileCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<LecturerProfileReadDto>> ExecuteAsync(string code, LecturerProfileUpdateDto dto)
        {
            var entity = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (entity == null)
                return OperationResult<LecturerProfileReadDto>.Failed("LecturerProfile not found", 404);

            if (!string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                var department = await _uow.Departments.Query().FirstOrDefaultAsync(d => d.DepartmentCode == dto.DepartmentCode);
                entity.DepartmentCode = dto.DepartmentCode;
                entity.DepartmentID = department?.DepartmentID;
            }

            entity.Degree = dto.Degree;
            if (dto.Organization != null)
                entity.Organization = dto.Organization;
            entity.GuideQuota = dto.GuideQuota ?? entity.GuideQuota;
            entity.DefenseQuota = dto.DefenseQuota ?? entity.DefenseQuota;
            entity.CurrentGuidingCount = dto.CurrentGuidingCount ?? entity.CurrentGuidingCount;

            if (dto.Gender != null)
                entity.Gender = dto.Gender;
            if (dto.DateOfBirth.HasValue)
                entity.DateOfBirth = dto.DateOfBirth;
            if (dto.Email != null)
                entity.Email = dto.Email;
            if (dto.PhoneNumber != null)
                entity.PhoneNumber = dto.PhoneNumber;
            if (dto.Address != null)
                entity.Address = dto.Address;
            if (dto.Notes != null)
                entity.Notes = dto.Notes;
            if (dto.FullName != null)
                entity.FullName = dto.FullName;

            entity.LastUpdated = DateTime.UtcNow;

            _uow.LecturerProfiles.Update(entity);
            await _uow.SaveChangesAsync();

            return OperationResult<LecturerProfileReadDto>.Succeeded(_mapper.Map<LecturerProfileReadDto>(entity));
        }
    }
}

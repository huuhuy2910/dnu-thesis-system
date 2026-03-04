using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.ProgressSubmissions;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Command;
using ThesisManagement.Api.DTOs.ProgressSubmissions.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.ProgressSubmissions
{
    public interface ICreateProgressSubmissionCommand
    {
        Task<OperationResult<ProgressSubmissionReadDto>> ExecuteAsync(ProgressSubmissionCreateDto dto);
    }

    public class CreateProgressSubmissionCommand : ICreateProgressSubmissionCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public CreateProgressSubmissionCommand(IUnitOfWork uow, IMapper mapper)
        {
            _uow = uow;
            _mapper = mapper;
        }

        public async Task<OperationResult<ProgressSubmissionReadDto>> ExecuteAsync(ProgressSubmissionCreateDto dto)
        {
            var validationError = ProgressSubmissionCommandValidator.ValidateCreate(dto);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<ProgressSubmissionReadDto>.Failed(validationError, 400);

            var code = await GenerateSubmissionCodeAsync();
            var ent = new ProgressSubmission
            {
                SubmissionCode = code,
                MilestoneID = dto.MilestoneID,
                MilestoneCode = dto.MilestoneCode,
                StudentUserID = dto.StudentUserID,
                StudentUserCode = dto.StudentUserCode,
                StudentProfileID = dto.StudentProfileID,
                StudentProfileCode = dto.StudentProfileCode,
                LecturerProfileID = dto.LecturerProfileID,
                LecturerCode = dto.LecturerCode,
                AttemptNumber = dto.AttemptNumber ?? 1,
                ReportTitle = dto.ReportTitle,
                ReportDescription = dto.ReportDescription,
                SubmittedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };
            await _uow.ProgressSubmissions.AddAsync(ent);
            try
            {
                await _uow.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                ent.SubmissionCode = await GenerateSubmissionCodeAsync();
                await _uow.SaveChangesAsync();
            }

            return OperationResult<ProgressSubmissionReadDto>.Succeeded(_mapper.Map<ProgressSubmissionReadDto>(ent), 201);
        }

        private async Task<string> GenerateSubmissionCodeAsync()
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var prefix = $"SUBF{datePart}";
            var existing = await _uow.ProgressSubmissions.Query().Where(s => EF.Functions.Like(s.SubmissionCode, prefix + "%")).Select(s => s.SubmissionCode).ToListAsync();
            var maxSuffix = 0;
            foreach (var c in existing)
            {
                if (c.Length > prefix.Length)
                {
                    var suffix = c.Substring(prefix.Length);
                    if (int.TryParse(suffix, out var n))
                        maxSuffix = Math.Max(maxSuffix, n);
                }
            }
            return $"{prefix}{(maxSuffix + 1):D3}";
        }
    }
}

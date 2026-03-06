using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.StudentProfiles.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.StudentProfiles
{
    public sealed record StudentAvatarQueryResult(string StudentCode, bool HasAvatar, string? ImageUrl);

    public interface IGetStudentProfileCreateQuery
    {
        StudentProfileCreateDto Execute();
    }

    public interface IGetStudentProfileUpdateQuery
    {
        Task<StudentProfileUpdateDto?> ExecuteAsync(string code);
    }

    public interface IGetStudentAvatarQuery
    {
        Task<StudentAvatarQueryResult?> ExecuteAsync(string code);
    }

    public class GetStudentProfileCreateQuery : IGetStudentProfileCreateQuery
    {
        public StudentProfileCreateDto Execute()
        {
            return new StudentProfileCreateDto(
                string.Empty,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "Đang học",
                null,
                null,
                null);
        }
    }

    public class GetStudentProfileUpdateQuery : IGetStudentProfileUpdateQuery
    {
        private readonly IUnitOfWork _uow;

        public GetStudentProfileUpdateQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<StudentProfileUpdateDto?> ExecuteAsync(string code)
        {
            var entity = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (entity == null)
                return null;

            return new StudentProfileUpdateDto(
                entity.StudentCode,
                entity.UserCode,
                entity.DepartmentCode,
                entity.ClassCode,
                entity.FacultyCode,
                entity.GPA,
                entity.AcademicStanding,
                entity.Gender,
                entity.DateOfBirth,
                entity.PhoneNumber,
                entity.StudentEmail,
                entity.Address,
                entity.EnrollmentYear,
                entity.Status,
                entity.GraduationYear,
                entity.Notes,
                entity.FullName);
        }
    }

    public class GetStudentAvatarQuery : IGetStudentAvatarQuery
    {
        private readonly IUnitOfWork _uow;

        public GetStudentAvatarQuery(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<StudentAvatarQueryResult?> ExecuteAsync(string code)
        {
            var student = await _uow.StudentProfiles.Query().AsNoTracking().FirstOrDefaultAsync(x => x.StudentCode == code);
            if (student == null)
                return null;

            return new StudentAvatarQueryResult(code, !string.IsNullOrEmpty(student.StudentImage), student.StudentImage);
        }
    }
}

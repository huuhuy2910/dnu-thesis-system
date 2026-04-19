using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.TopicRenameRequests.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Services.TopicRenameRequests
{
    public interface ITopicRenameRequestContextService
    {
        Task<Topic?> ResolveTopicAsync(int? topicId, string? topicCode);
        Task<TopicRenameTemplateDataDto> BuildTemplateDataAsync(TopicRenameRequest request, string? placeOfBirthOverride = null);
        Task<TopicRenameTemplateDataDto> BuildTemplateDataForTopicAsync(Topic topic, string? placeOfBirthOverride = null);
    }

    public sealed class TopicRenameRequestContextService : ITopicRenameRequestContextService
    {
        private readonly IUnitOfWork _uow;

        public TopicRenameRequestContextService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<Topic?> ResolveTopicAsync(int? topicId, string? topicCode)
        {
            if (topicId.HasValue && topicId.Value > 0)
                return await _uow.Topics.GetByIdAsync(topicId.Value);

            if (!string.IsNullOrWhiteSpace(topicCode))
                return await _uow.Topics.GetByCodeAsync(topicCode.Trim());

            return null;
        }

        public async Task<TopicRenameTemplateDataDto> BuildTemplateDataAsync(TopicRenameRequest request, string? placeOfBirthOverride = null)
        {
            var topic = await ResolveTopicAsync(request.TopicId, request.TopicCode)
                ?? throw new InvalidOperationException($"Topic '{request.TopicCode}' not found");

            return await BuildTemplateDataForTopicAsync(topic, placeOfBirthOverride, request.NewTitle, request.Reason);
        }

        public Task<TopicRenameTemplateDataDto> BuildTemplateDataForTopicAsync(Topic topic, string? placeOfBirthOverride = null)
            => BuildTemplateDataForTopicAsync(topic, placeOfBirthOverride, string.Empty, null);

        private async Task<TopicRenameTemplateDataDto> BuildTemplateDataForTopicAsync(Topic topic, string? placeOfBirthOverride, string newTitle, string? reason)
        {
            var student = await ResolveStudentProfileAsync(topic);
            var lecturer = await ResolveLecturerProfileAsync(topic);
            var studentClass = student?.ClassID.HasValue == true
                ? await _uow.Classes.Query().FirstOrDefaultAsync(x => x.ClassID == student.ClassID.Value)
                : null;
            var studentDepartment = await ResolveStudentDepartmentAsync(student);
            var topicDepartment = await ResolveTopicDepartmentAsync(topic);

            var fullName = student?.FullName?.Trim();
            var studentCode = student?.StudentCode?.Trim() ?? topic.ProposerStudentCode?.Trim() ?? string.Empty;

            return new TopicRenameTemplateDataDto(
                StudentFullName: fullName ?? studentCode,
                DateOfBirth: student?.DateOfBirth.HasValue == true ? student.DateOfBirth.Value.ToString("dd/MM/yyyy") : string.Empty,
                PlaceOfBirth: !string.IsNullOrWhiteSpace(placeOfBirthOverride)
                    ? placeOfBirthOverride.Trim()
                    : student?.Address?.Trim(),
                StudentCode: studentCode,
                EnrollmentYear: student?.EnrollmentYear?.ToString(),
                ClassName: studentClass?.ClassName,
                MajorName: studentDepartment?.Name ?? student?.DepartmentCode,
                PhoneNumber: student?.PhoneNumber,
                Email: student?.StudentEmail,
                CurrentTopicTitle: topic.Title,
                SupervisorName: lecturer?.FullName?.Trim() ?? lecturer?.LecturerCode,
                NewTopicTitle: string.IsNullOrWhiteSpace(newTitle) ? topic.Title : newTitle,
                Reason: reason,
                DepartmentName: topicDepartment?.Name ?? studentDepartment?.Name ?? topic.DepartmentCode);
        }

        private async Task<StudentProfile?> ResolveStudentProfileAsync(Topic topic)
        {
            if (topic.ProposerStudentProfileID.HasValue)
            {
                var byId = await _uow.StudentProfiles.GetByIdAsync(topic.ProposerStudentProfileID.Value);
                if (byId != null) return byId;
            }

            if (!string.IsNullOrWhiteSpace(topic.ProposerStudentCode))
            {
                var studentCode = topic.ProposerStudentCode.Trim();
                var byCode = await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.StudentCode == studentCode);
                if (byCode != null) return byCode;
            }

            if (!string.IsNullOrWhiteSpace(topic.ProposerUserCode))
            {
                var byUserCode = await _uow.StudentProfiles.Query().FirstOrDefaultAsync(x => x.UserCode == topic.ProposerUserCode);
                if (byUserCode != null) return byUserCode;
            }

            return null;
        }

        private async Task<LecturerProfile?> ResolveLecturerProfileAsync(Topic topic)
        {
            if (topic.SupervisorLecturerProfileID.HasValue)
            {
                var byId = await _uow.LecturerProfiles.GetByIdAsync(topic.SupervisorLecturerProfileID.Value);
                if (byId != null) return byId;
            }

            if (!string.IsNullOrWhiteSpace(topic.SupervisorLecturerCode))
            {
                var lecturerCode = topic.SupervisorLecturerCode.Trim();
                var byCode = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(x => x.LecturerCode == lecturerCode);
                if (byCode != null) return byCode;
            }

            if (!string.IsNullOrWhiteSpace(topic.SupervisorUserCode))
            {
                var byUserCode = await _uow.LecturerProfiles.Query().FirstOrDefaultAsync(x => x.UserCode == topic.SupervisorUserCode);
                if (byUserCode != null) return byUserCode;
            }

            return null;
        }

        private async Task<Department?> ResolveStudentDepartmentAsync(StudentProfile? student)
        {
            if (student == null)
                return null;

            if (student.DepartmentID.HasValue)
            {
                var byId = await _uow.Departments.GetByIdAsync(student.DepartmentID.Value);
                if (byId != null) return byId;
            }

            if (!string.IsNullOrWhiteSpace(student.DepartmentCode))
            {
                var departmentCode = student.DepartmentCode.Trim();
                var byCode = await _uow.Departments.Query().FirstOrDefaultAsync(x => x.DepartmentCode == departmentCode);
                if (byCode != null) return byCode;
            }

            return null;
        }

        private async Task<Department?> ResolveTopicDepartmentAsync(Topic topic)
        {
            if (topic.DepartmentID.HasValue)
            {
                var byId = await _uow.Departments.GetByIdAsync(topic.DepartmentID.Value);
                if (byId != null) return byId;
            }

            if (!string.IsNullOrWhiteSpace(topic.DepartmentCode))
            {
                var departmentCode = topic.DepartmentCode.Trim();
                var byCode = await _uow.Departments.Query().FirstOrDefaultAsync(x => x.DepartmentCode == departmentCode);
                if (byCode != null) return byCode;
            }

            return null;
        }
    }
}
using System;
using System.Collections.Generic;
using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.DTOs.TopicRenameRequests.Query
{
    public class TopicRenameRequestFilter : BaseFilter
    {
        public int? TopicID { get; set; }
        public string? TopicCode { get; set; }
        public string? Status { get; set; }
        public string? RequestedByUserCode { get; set; }
        public string? ReviewedByUserCode { get; set; }
        public string? OldTitle { get; set; }
        public string? NewTitle { get; set; }
    }

    public record TopicRenameRequestReadDto(
        int RequestId,
        string RequestCode,
        int? TopicId,
        string TopicCode,
        string OldTitle,
        string NewTitle,
        string? Reason,
        string Status,
        string RequestedByUserCode,
        string RequestedByRole,
        string? ReviewedByUserCode,
        string? ReviewedByRole,
        string? ReviewComment,
        DateTime RequestedAt,
        DateTime? ReviewedAt,
        DateTime? AppliedAt,
        string? GeneratedFileUrl,
        string? GeneratedFileName,
        long? GeneratedFileSize,
        string? GeneratedFileHash,
        DateTime CreatedAt,
        DateTime LastUpdated,
        string? RequestedByName = null,
        string? ReviewedByName = null,
        string? RequestedByStudentCode = null,
        string? ReviewedByLecturerCode = null);

    public record TopicRenameTemplateDataDto(
        string StudentFullName,
        string DateOfBirth,
        string? PlaceOfBirth,
        string StudentCode,
        string? EnrollmentYear,
        string? ClassName,
        string? MajorName,
        string? PhoneNumber,
        string? Email,
        string CurrentTopicTitle,
        string? SupervisorName,
        string NewTopicTitle,
        string? Reason,
        string? DepartmentName);

    public record TopicRenameRequestFileReadDto(
        int FileId,
        string FileCode,
        int RequestId,
        string FileType,
        string FileName,
        string? OriginalFileName,
        string FileUrl,
        string? FilePath,
        string StorageProvider,
        string? MimeType,
        long? FileSize,
        string? FileHash,
        int FileVersion,
        bool IsCurrent,
        string? UploadedByUserCode,
        DateTime CreatedAt,
        DateTime LastUpdated);

    public record TopicTitleHistoryReadDto(
        int HistoryId,
        string HistoryCode,
        int? TopicId,
        string TopicCode,
        int? RequestId,
        string? RequestCode,
        string PreviousTitle,
        string NewTitle,
        string ChangeType,
        string? ChangeReason,
        string? ApprovalComment,
        string ChangedByUserCode,
        string ChangedByRole,
        string? ApprovedByUserCode,
        string? ApprovedByRole,
        DateTime EffectiveAt,
        DateTime CreatedAt,
        DateTime LastUpdated);

    public record TopicRenameRequestDetailDto(
        TopicRenameRequestReadDto Request,
        TopicRenameTemplateDataDto TemplateData,
        IEnumerable<TopicRenameRequestFileReadDto> Files,
        IEnumerable<TopicTitleHistoryReadDto> History);
}
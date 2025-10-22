using System;

namespace ThesisManagement.Api.DTOs
{
    /// <summary>
    /// DTO để đọc thông tin activity log
    /// </summary>
    public record SystemActivityLogReadDto(
        int LogID,
        string? EntityName,
        string? EntityID,
        string ActionType,
        string? ActionDescription,
        string? OldValue,
        string? NewValue,
        int? UserID,
        string? UserCode,
        string? UserRole,
        string? IPAddress,
        string? DeviceInfo,
        string? Module,
        DateTime PerformedAt,
        string? Status,
        string? RelatedRecordCode,
        string? Comment
    );

    /// <summary>
    /// Filter để tìm kiếm activity logs
    /// </summary>
    public class SystemActivityLogFilter : BaseFilter
    {
        public string? EntityName { get; set; }
        public string? EntityID { get; set; }
        public string? ActionType { get; set; }
        public int? UserID { get; set; }
        public string? UserCode { get; set; }
        public string? UserRole { get; set; }
        public string? Module { get; set; }
        public string? Status { get; set; }
        public DateTime? PerformedFrom { get; set; }
        public DateTime? PerformedTo { get; set; }
        public string? IPAddress { get; set; }
    }
}

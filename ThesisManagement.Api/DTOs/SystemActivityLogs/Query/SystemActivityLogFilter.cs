using System;

namespace ThesisManagement.Api.DTOs.SystemActivityLogs.Query
{
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
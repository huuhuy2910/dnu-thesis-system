using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.DTOs.Workflows.Query
{
    public class TopicWorkflowAuditFilter : BaseFilter
    {
        public int? TopicID { get; set; }
        public string? TopicCode { get; set; }
        public string? ActionType { get; set; }
        public string? StatusCode { get; set; }
        public int? IsSuccess { get; set; }
    }
}

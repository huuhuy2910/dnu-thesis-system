namespace ThesisManagement.Api.DTOs.CatalogTopics.Query
{
    public class CatalogTopicWithTagsFilter : BaseFilter
    {
        public string? Title { get; set; }
        public string? CatalogTopicCode { get; set; }
        public string? DepartmentCode { get; set; }
        public string? AssignedStatus { get; set; }
        public string? TagCode { get; set; }
        public string? TagName { get; set; }
    }

    public record CatalogTopicTagItemDto(
        int TagID,
        string TagCode,
        string TagName
    );

    public record CatalogTopicWithTagsReadDto(
        int CatalogTopicID,
        string CatalogTopicCode,
        string Title,
        string? Summary,
        string? DepartmentCode,
        string? AssignedStatus,
        DateTime? AssignedAt,
        DateTime? CreatedAt,
        DateTime? LastUpdated,
        IReadOnlyList<CatalogTopicTagItemDto> Tags
    );

    public record CatalogTopicEligibleLecturerDto(
        int LecturerProfileID,
        string LecturerCode,
        string? UserCode,
        string? DepartmentCode,
        string? Degree,
        int GuideQuota,
        int DefenseQuota,
        int CurrentGuidingCount,
        string? FullName,
        string? Email,
        string? PhoneNumber,
        IReadOnlyList<CatalogTopicTagItemDto> Tags
    );

    public record CatalogTopicDetailReadDto(
        int CatalogTopicID,
        string CatalogTopicCode,
        string Title,
        string? Summary,
        string? DepartmentCode,
        string? AssignedStatus,
        DateTime? AssignedAt,
        DateTime? CreatedAt,
        DateTime? LastUpdated,
        IReadOnlyList<CatalogTopicTagItemDto> Tags,
        IReadOnlyList<CatalogTopicEligibleLecturerDto> EligibleLecturers
    );
}

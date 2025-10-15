namespace ThesisManagement.Api.DTOs
{
    public class TagDto
    {
        public string TagCode { get; set; } = string.Empty;
        public string TagName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int UsageCount { get; set; }
    }

    public class TagReadDto
    {
        public int TagID { get; set; }
        public string TagCode { get; set; } = null!;
        public string TagName { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class TagCreateDto
    {
        public string TagName { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class TagUpdateDto
    {
        public string TagName { get; set; } = null!;
        public string? Description { get; set; }
    }
}
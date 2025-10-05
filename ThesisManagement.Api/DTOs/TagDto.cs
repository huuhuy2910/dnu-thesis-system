namespace ThesisManagement.Api.DTOs
{
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
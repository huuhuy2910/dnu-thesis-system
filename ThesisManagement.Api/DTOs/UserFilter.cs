namespace ThesisManagement.Api.DTOs
{
    public class UserFilter : BaseFilter
    {
        public string? Username { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? UserCode { get; set; }
    }
}
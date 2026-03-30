namespace ThesisManagement.Api.DTOs.Users.Command
{
    public record UserCreateDto(string UserCode, string Password, string Role);
    public record UserUpdateDto(string? Role);
    public record LoginDto(string Username, string Password);
    public record ResetPasswordDto(string UserCode, string NewPassword);
    public record ResetDefaultPasswordDto(string UserCode);
}
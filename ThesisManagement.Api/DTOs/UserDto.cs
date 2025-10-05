using System;

namespace ThesisManagement.Api.DTOs
{
    public record UserCreateDto(string UserCode, string Password, string FullName, string Role, string? Email);
    public record UserUpdateDto(string? FullName, string? Email, string? Role);
    public record UserReadDto(int UserID, string UserCode, string FullName, string? Email, string Role, DateTime CreatedAt, DateTime LastUpdated);
}

using System;

namespace ThesisManagement.Api.DTOs
{
    public record UserCreateDto(string UserCode, string Password, string Role);
    public record UserUpdateDto(string? Role);
    public record UserReadDto(int UserID, string UserCode, string Role, DateTime CreatedAt, DateTime LastUpdated);
}

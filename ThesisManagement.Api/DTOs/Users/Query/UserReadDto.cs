using System;

namespace ThesisManagement.Api.DTOs.Users.Query
{
    public record UserReadDto(int UserID, string UserCode, string Role, DateTime CreatedAt, DateTime LastUpdated);
    public record LoginResponseDto(int UserID, string UserCode, string Role, DateTime CreatedAt);
}
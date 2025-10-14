using System;

namespace ThesisManagement.Api.DTOs
{
    public record LoginDto(string Username, string Password); // Username here is actually UserCode
    public record LoginResponseDto(int UserID, string UserCode, string Role, DateTime CreatedAt);
}

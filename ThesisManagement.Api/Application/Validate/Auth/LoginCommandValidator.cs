using ThesisManagement.Api.DTOs.Users.Command;

namespace ThesisManagement.Api.Application.Validate.Auth
{
    public static class LoginCommandValidator
    {
        public static string? Validate(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return "Username và Password không được để trống";

            return null;
        }
    }
}

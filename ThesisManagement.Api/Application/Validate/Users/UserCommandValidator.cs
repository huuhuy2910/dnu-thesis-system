using ThesisManagement.Api.DTOs.Users.Command;

namespace ThesisManagement.Api.Application.Validate.Users
{
    public static class UserCommandValidator
    {
        public static string? ValidateCreate(UserCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserCode))
                return "UserCode is required";

            if (string.IsNullOrWhiteSpace(dto.Password))
                return "Password is required";

            if (string.IsNullOrWhiteSpace(dto.Role))
                return "Role is required";

            return null;
        }

        public static string? ValidateUpdate(UserUpdateDto dto)
        {
            if (dto.Role is not null && string.IsNullOrWhiteSpace(dto.Role))
                return "Role cannot be empty";

            return null;
        }
    }
}

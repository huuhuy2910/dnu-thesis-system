using Microsoft.AspNetCore.Http;

namespace ThesisManagement.Api.Application.Validate.LecturerProfiles
{
    public static class LecturerProfileCommandValidator
    {
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".bmp"
        };

        public static string? ValidateCreate(string? userCode)
        {
            if (string.IsNullOrWhiteSpace(userCode))
                return "UserCode is required";

            return null;
        }

        public static string? ValidateUploadAvatar(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return "File ảnh là bắt buộc";

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
                return "Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, bmp)";

            if (file.Length > 10 * 1024 * 1024)
                return "Kích thước file không được vượt quá 10MB";

            return null;
        }
    }
}

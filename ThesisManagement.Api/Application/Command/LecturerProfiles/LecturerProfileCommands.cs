using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.LecturerProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.LecturerProfiles
{
    public sealed record LecturerAvatarUploadResult(string LecturerCode, string ImageUrl, string Message);

    public interface IUploadLecturerAvatarCommand
    {
        Task<OperationResult<LecturerAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file);
    }

    public class UploadLecturerAvatarCommand : IUploadLecturerAvatarCommand
    {
        private readonly IUnitOfWork _uow;

        public UploadLecturerAvatarCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<LecturerAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file)
        {
            var lecturer = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (lecturer == null)
                return OperationResult<LecturerAvatarUploadResult>.Failed("Giảng viên không tồn tại", 404);

            var validationError = LecturerProfileCommandValidator.ValidateUploadAvatar(file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LecturerAvatarUploadResult>.Failed(validationError, 400);

            var fileExtension = Path.GetExtension(file!.FileName).ToLowerInvariant();
            var avatarsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars", "lecturers");
            if (!Directory.Exists(avatarsRoot))
                Directory.CreateDirectory(avatarsRoot);

            if (!string.IsNullOrEmpty(lecturer.ProfileImage))
            {
                var oldImagePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    lecturer.ProfileImage.TrimStart('/').Replace("/", "\\"));

                if (System.IO.File.Exists(oldImagePath))
                {
                    try
                    {
                        System.IO.File.Delete(oldImagePath);
                    }
                    catch
                    {
                    }
                }
            }

            var uniqueName = $"{code}_{Guid.NewGuid():N}{fileExtension}";
            var savePath = Path.Combine(avatarsRoot, uniqueName);

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/avatars/lecturers/{uniqueName}";
            lecturer.ProfileImage = imageUrl;
            lecturer.LastUpdated = DateTime.UtcNow;

            _uow.LecturerProfiles.Update(lecturer);
            await _uow.SaveChangesAsync();

            return OperationResult<LecturerAvatarUploadResult>.Succeeded(
                new LecturerAvatarUploadResult(code, imageUrl, "Upload avatar thành công"));
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.StudentProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.StudentProfiles
{
    public sealed record StudentAvatarUploadResult(string StudentCode, string ImageUrl, string Message);

    public interface IUploadStudentAvatarCommand
    {
        Task<OperationResult<StudentAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file);
    }

    public class UploadStudentAvatarCommand : IUploadStudentAvatarCommand
    {
        private readonly IUnitOfWork _uow;

        public UploadStudentAvatarCommand(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<OperationResult<StudentAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file)
        {
            var student = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (student == null)
                return OperationResult<StudentAvatarUploadResult>.Failed("Sinh viên không tồn tại", 404);

            var validationError = StudentProfileCommandValidator.ValidateUploadAvatar(file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<StudentAvatarUploadResult>.Failed(validationError, 400);

            var fileExtension = Path.GetExtension(file!.FileName).ToLowerInvariant();
            var avatarsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars", "students");
            if (!Directory.Exists(avatarsRoot))
                Directory.CreateDirectory(avatarsRoot);

            if (!string.IsNullOrEmpty(student.StudentImage))
            {
                var oldImagePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    student.StudentImage.TrimStart('/').Replace("/", "\\"));

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

            var imageUrl = $"/avatars/students/{uniqueName}";
            student.StudentImage = imageUrl;
            student.LastUpdated = DateTime.UtcNow;

            _uow.StudentProfiles.Update(student);
            await _uow.SaveChangesAsync();

            return OperationResult<StudentAvatarUploadResult>.Succeeded(
                new StudentAvatarUploadResult(code, imageUrl, "Upload avatar thành công"));
        }
    }
}

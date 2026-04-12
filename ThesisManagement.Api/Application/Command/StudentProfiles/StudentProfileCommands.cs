using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.StudentProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

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
        private readonly IFileStorageService _storageService;

        public UploadStudentAvatarCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<StudentAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file)
        {
            var student = await _uow.StudentProfiles.GetByCodeAsync(code);
            if (student == null)
                return OperationResult<StudentAvatarUploadResult>.Failed("Sinh viên không tồn tại", 404);

            var validationError = StudentProfileCommandValidator.ValidateUploadAvatar(file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<StudentAvatarUploadResult>.Failed(validationError, 400);

            var oldImageUrl = student.StudentImage;
            var uploadResult = await _storageService.UploadAsync(file!, "avatars/students");
            if (!uploadResult.Success)
                return OperationResult<StudentAvatarUploadResult>.Failed(uploadResult.ErrorMessage ?? "Upload avatar failed", uploadResult.StatusCode);

            var imageUrl = uploadResult.Data!;
            student.StudentImage = imageUrl;
            student.LastUpdated = DateTime.UtcNow;

            _uow.StudentProfiles.Update(student);
            await _uow.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(oldImageUrl) && !string.Equals(oldImageUrl, imageUrl, StringComparison.OrdinalIgnoreCase))
            {
                await _storageService.DeleteAsync(oldImageUrl);
            }

            return OperationResult<StudentAvatarUploadResult>.Succeeded(
                new StudentAvatarUploadResult(code, imageUrl, "Upload avatar thành công"));
        }
    }
}

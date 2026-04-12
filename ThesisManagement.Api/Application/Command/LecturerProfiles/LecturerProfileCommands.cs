using AutoMapper;
using Microsoft.AspNetCore.Http;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Validate.LecturerProfiles;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;
using ThesisManagement.Api.Services.FileStorage;

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
        private readonly IFileStorageService _storageService;

        public UploadLecturerAvatarCommand(IUnitOfWork uow, IFileStorageService storageService)
        {
            _uow = uow;
            _storageService = storageService;
        }

        public async Task<OperationResult<LecturerAvatarUploadResult>> ExecuteAsync(string code, IFormFile? file)
        {
            var lecturer = await _uow.LecturerProfiles.GetByCodeAsync(code);
            if (lecturer == null)
                return OperationResult<LecturerAvatarUploadResult>.Failed("Giảng viên không tồn tại", 404);

            var validationError = LecturerProfileCommandValidator.ValidateUploadAvatar(file);
            if (!string.IsNullOrWhiteSpace(validationError))
                return OperationResult<LecturerAvatarUploadResult>.Failed(validationError, 400);

            var oldImageUrl = lecturer.ProfileImage;
            var uploadResult = await _storageService.UploadAsync(file!, "avatars/lecturers");
            if (!uploadResult.Success)
                return OperationResult<LecturerAvatarUploadResult>.Failed(uploadResult.ErrorMessage ?? "Upload avatar failed", uploadResult.StatusCode);

            var imageUrl = uploadResult.Data!;
            lecturer.ProfileImage = imageUrl;
            lecturer.LastUpdated = DateTime.UtcNow;

            _uow.LecturerProfiles.Update(lecturer);
            await _uow.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(oldImageUrl) && !string.Equals(oldImageUrl, imageUrl, StringComparison.OrdinalIgnoreCase))
            {
                await _storageService.DeleteAsync(oldImageUrl);
            }

            return OperationResult<LecturerAvatarUploadResult>.Succeeded(
                new LecturerAvatarUploadResult(code, imageUrl, "Upload avatar thành công"));
        }
    }
}

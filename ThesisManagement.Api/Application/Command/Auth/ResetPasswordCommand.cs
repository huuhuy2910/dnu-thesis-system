using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Users.Command;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Auth
{
    public interface IResetPasswordCommand
    {
        Task<OperationResult<object>> ExecuteAsync(ResetPasswordDto dto);
    }

    public class ResetPasswordCommand : IResetPasswordCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;

        public ResetPasswordCommand(
            IUnitOfWork uow,
            IAuthService authService,
            ICurrentUserService currentUserService)
        {
            _uow = uow;
            _authService = authService;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<object>> ExecuteAsync(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserCode) || string.IsNullOrWhiteSpace(dto.NewPassword))
                return OperationResult<object>.Failed("UserCode và NewPassword không được để trống", 400);

            var actorUserCode = _currentUserService.GetUserCode();
            var actorRole = _currentUserService.GetUserRole();
            if (string.IsNullOrWhiteSpace(actorUserCode))
                return OperationResult<object>.Failed("Unauthorized", 401);

            var targetUserCode = dto.UserCode.Trim();
            var isAdmin = string.Equals(actorRole, "Admin", StringComparison.OrdinalIgnoreCase);
            var isSelf = string.Equals(actorUserCode, targetUserCode, StringComparison.OrdinalIgnoreCase);
            if (!isAdmin && !isSelf)
                return OperationResult<object>.Failed("Bạn không có quyền đặt lại mật khẩu cho tài khoản này", 403);

            var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.UserCode == targetUserCode);
            if (user == null)
                return OperationResult<object>.Failed("User not found", 404);

            var newPassword = dto.NewPassword.Trim();
            if (string.Equals(newPassword, user.UserCode, StringComparison.OrdinalIgnoreCase))
                return OperationResult<object>.Failed("Mật khẩu mới không được trùng với UserCode", 400);

            user.PasswordHash = _authService.HashPassword(newPassword);
            user.LastUpdated = DateTime.UtcNow;

            _uow.Users.Update(user);
            await _uow.SaveChangesAsync();

            return OperationResult<object>.Succeeded(new
            {
                UserCode = user.UserCode,
                Message = "Đặt lại mật khẩu thành công"
            });
        }
    }

    public interface IResetDefaultPasswordCommand
    {
        Task<OperationResult<object>> ExecuteAsync(ResetDefaultPasswordDto dto);
    }

    public class ResetDefaultPasswordCommand : IResetDefaultPasswordCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;

        public ResetDefaultPasswordCommand(
            IUnitOfWork uow,
            IAuthService authService,
            ICurrentUserService currentUserService)
        {
            _uow = uow;
            _authService = authService;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<object>> ExecuteAsync(ResetDefaultPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserCode))
                return OperationResult<object>.Failed("UserCode không được để trống", 400);

            var actorRole = _currentUserService.GetUserRole();
            var isAdmin = string.Equals(actorRole, "Admin", StringComparison.OrdinalIgnoreCase);
            if (!isAdmin)
                return OperationResult<object>.Failed("Chỉ Admin mới có quyền đặt lại mật khẩu mặc định", 403);

            var targetUserCode = dto.UserCode.Trim();
            var user = await _uow.Users.Query().FirstOrDefaultAsync(x => x.UserCode == targetUserCode);
            if (user == null)
                return OperationResult<object>.Failed("User not found", 404);

            user.PasswordHash = _authService.HashPassword(user.UserCode);
            user.LastUpdated = DateTime.UtcNow;

            _uow.Users.Update(user);
            await _uow.SaveChangesAsync();

            return OperationResult<object>.Succeeded(new
            {
                UserCode = user.UserCode,
                DefaultPassword = user.UserCode,
                Message = "Đã đặt lại mật khẩu mặc định theo UserCode"
            });
        }
    }
}

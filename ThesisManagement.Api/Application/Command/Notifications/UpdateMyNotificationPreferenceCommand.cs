using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public class UpdateMyNotificationPreferenceCommand : IUpdateMyNotificationPreferenceCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public UpdateMyNotificationPreferenceCommand(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<OperationResult<NotificationPreferenceReadDto>> ExecuteAsync(string notifCategory, UpdateNotificationPreferenceDto dto)
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();
            if (!userId.HasValue || string.IsNullOrWhiteSpace(userCode))
                return OperationResult<NotificationPreferenceReadDto>.Failed("Unauthorized", 401);

            if (string.IsNullOrWhiteSpace(notifCategory))
                return OperationResult<NotificationPreferenceReadDto>.Failed("notifCategory is required", 400);

            var preference = await _uow.NotificationPreferences.Query()
                .FirstOrDefaultAsync(x => x.TargetUserID == userId.Value && x.NotifCategory == notifCategory);

            if (preference == null)
            {
                preference = new NotificationPreference
                {
                    TargetUserID = userId.Value,
                    TargetUserCode = userCode,
                    NotifCategory = notifCategory,
                    InAppEnabled = dto.InAppEnabled ? 1 : 0,
                    EmailEnabled = dto.EmailEnabled ? 1 : 0,
                    PushEnabled = dto.PushEnabled ? 1 : 0,
                    DigestMode = dto.DigestMode,
                    QuietFrom = dto.QuietFrom,
                    QuietTo = dto.QuietTo,
                    UpdatedAt = DateTime.UtcNow
                };
                await _uow.NotificationPreferences.AddAsync(preference);
            }
            else
            {
                preference.InAppEnabled = dto.InAppEnabled ? 1 : 0;
                preference.EmailEnabled = dto.EmailEnabled ? 1 : 0;
                preference.PushEnabled = dto.PushEnabled ? 1 : 0;
                preference.DigestMode = dto.DigestMode;
                preference.QuietFrom = dto.QuietFrom;
                preference.QuietTo = dto.QuietTo;
                preference.UpdatedAt = DateTime.UtcNow;
                _uow.NotificationPreferences.Update(preference);
            }

            await _uow.SaveChangesAsync();

            var result = new NotificationPreferenceReadDto(
                preference.PreferenceID,
                preference.NotifCategory,
                preference.InAppEnabled == 1,
                preference.EmailEnabled == 1,
                preference.PushEnabled == 1,
                preference.DigestMode,
                preference.QuietFrom,
                preference.QuietTo,
                preference.UpdatedAt);

            return OperationResult<NotificationPreferenceReadDto>.Succeeded(result);
        }
    }
}

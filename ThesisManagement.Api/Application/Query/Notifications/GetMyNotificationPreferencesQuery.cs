using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Notifications
{
    public class GetMyNotificationPreferencesQuery : IGetMyNotificationPreferencesQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public GetMyNotificationPreferencesQuery(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<NotificationPreferenceReadDto>> ExecuteAsync(NotificationPreferenceFilter filter)
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();

            if (!userId.HasValue && string.IsNullOrWhiteSpace(userCode))
                return Enumerable.Empty<NotificationPreferenceReadDto>();

            var query = _uow.NotificationPreferences.Query()
                .Where(x => (userId.HasValue && x.TargetUserID == userId.Value) || (!string.IsNullOrWhiteSpace(userCode) && x.TargetUserCode == userCode));

            if (!string.IsNullOrWhiteSpace(filter.NotifCategory))
                query = query.Where(x => x.NotifCategory == filter.NotifCategory);

            var rows = await query
                .OrderBy(x => x.NotifCategory)
                .Select(x => new
                {
                    x.PreferenceID,
                    x.NotifCategory,
                    x.InAppEnabled,
                    x.EmailEnabled,
                    x.PushEnabled,
                    x.DigestMode,
                    x.QuietFrom,
                    x.QuietTo,
                    x.UpdatedAt
                })
                .ToListAsync();

            var items = rows.Select(x => new NotificationPreferenceReadDto(
                x.PreferenceID,
                x.NotifCategory,
                x.InAppEnabled == 1,
                x.EmailEnabled == 1,
                x.PushEnabled == 1,
                x.DigestMode,
                x.QuietFrom,
                x.QuietTo,
                x.UpdatedAt));

            return items;
        }
    }
}

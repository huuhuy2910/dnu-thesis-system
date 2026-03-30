using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Notifications
{
    public class GetMyUnreadCountQuery : IGetMyUnreadCountQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public GetMyUnreadCountQuery(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<NotificationUnreadCountDto> ExecuteAsync()
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();

            if (!userId.HasValue && string.IsNullOrWhiteSpace(userCode))
                return new NotificationUnreadCountDto(0);

            var count = await _uow.NotificationRecipients.Query()
                .Where(x => ((userId.HasValue && x.TargetUserID == userId.Value) || (!string.IsNullOrWhiteSpace(userCode) && x.TargetUserCode == userCode))
                            && x.IsRead == 0
                            && !x.DismissedAt.HasValue)
                .CountAsync();

            return new NotificationUnreadCountDto(count);
        }
    }
}

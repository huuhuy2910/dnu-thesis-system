using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Notifications
{
    public class GetMyNotificationsListQuery : IGetMyNotificationsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;

        public GetMyNotificationsListQuery(IUnitOfWork uow, ICurrentUserService currentUserService)
        {
            _uow = uow;
            _currentUserService = currentUserService;
        }

        public async Task<(IEnumerable<NotificationRecipientReadDto> Items, int TotalCount)> ExecuteAsync(NotificationFilter filter)
        {
            var userId = _currentUserService.GetUserId();
            var userCode = _currentUserService.GetUserCode();

            if (!userId.HasValue && string.IsNullOrWhiteSpace(userCode))
                return (Enumerable.Empty<NotificationRecipientReadDto>(), 0);

            var page = filter.Page <= 0 ? 1 : filter.Page;
            var pageSize = filter.PageSize <= 0 ? 20 : Math.Min(filter.PageSize, 100);

            var recipientQuery = _uow.NotificationRecipients.Query()
                .Where(x => (userId.HasValue && x.TargetUserID == userId.Value) || (!string.IsNullOrWhiteSpace(userCode) && x.TargetUserCode == userCode));

            if (!filter.IncludeDismissed)
                recipientQuery = recipientQuery.Where(x => !x.DismissedAt.HasValue);

            if (filter.IsRead.HasValue)
                recipientQuery = recipientQuery.Where(x => x.IsRead == (filter.IsRead.Value ? 1 : 0));

            var notificationQuery = _uow.Notifications.Query();

            if (!string.IsNullOrWhiteSpace(filter.NotifCategory))
                notificationQuery = notificationQuery.Where(x => x.NotifCategory == filter.NotifCategory);

            if (!string.IsNullOrWhiteSpace(filter.NotifPriority))
                notificationQuery = notificationQuery.Where(x => x.NotifPriority == filter.NotifPriority);

            if (filter.FromDate.HasValue)
                notificationQuery = notificationQuery.Where(x => x.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                notificationQuery = notificationQuery.Where(x => x.CreatedAt <= filter.ToDate.Value);

            var query = from r in recipientQuery
                        join n in notificationQuery on r.NotificationID equals n.NotificationID
                        select new { r, n };

            var totalCount = await query.CountAsync();

            var rows = await query
                .OrderByDescending(x => x.r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = rows.Select(x => new NotificationRecipientReadDto(
                x.r.RecipientID,
                x.r.NotificationID,
                x.r.TargetUserID,
                x.r.TargetUserCode,
                x.r.DeliveryState,
                x.r.IsRead == 1,
                x.r.ReadAt,
                x.r.SeenAt,
                x.r.DismissedAt,
                x.r.CreatedAt,
                new NotificationReadDto(
                    x.n.NotificationID,
                    x.n.NotificationCode,
                    x.n.NotifChannel,
                    x.n.NotifCategory,
                    x.n.NotifTitle,
                    x.n.NotifBody,
                    x.n.NotifPriority,
                    x.n.ActionType,
                    x.n.ActionUrl,
                    x.n.ImageUrl,
                    x.n.RelatedEntityName,
                    x.n.RelatedEntityCode,
                    x.n.RelatedEntityID,
                    x.n.TriggeredByUserCode,
                    x.n.IsGlobal == 1,
                    x.n.CreatedAt,
                    x.n.ExpiresAt)));

            return (items, totalCount);
        }

    }
}

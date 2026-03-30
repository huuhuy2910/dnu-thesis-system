using Microsoft.Extensions.Logging;
using ThesisManagement.Api.DTOs.Notifications.Command;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public class NotificationEventPublisher : INotificationEventPublisher
    {
        private readonly ICreateNotificationCommand _createNotificationCommand;
        private readonly ILogger<NotificationEventPublisher> _logger;

        public NotificationEventPublisher(
            ICreateNotificationCommand createNotificationCommand,
            ILogger<NotificationEventPublisher> logger)
        {
            _createNotificationCommand = createNotificationCommand;
            _logger = logger;
        }

        public async Task PublishAsync(NotificationEventRequest request)
        {
            var targetUserCodes = (request.TargetUserCodes ?? new List<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!request.IsGlobal && targetUserCodes.Count == 0)
                return;

            try
            {
                var result = await _createNotificationCommand.ExecuteAsync(new CreateNotificationDto(
                    request.NotifCategory,
                    request.NotifTitle,
                    request.NotifBody,
                    request.NotifPriority,
                    request.ActionType,
                    request.ActionUrl,
                    null,
                    request.RelatedEntityName,
                    request.RelatedEntityCode,
                    request.RelatedEntityID,
                    request.IsGlobal,
                    targetUserCodes,
                    request.NotifChannel));

                if (!result.Success)
                {
                    _logger.LogWarning(
                        "Notification publish failed. Category={Category}, Entity={EntityName}, Code={EntityCode}, Error={Error}",
                        request.NotifCategory,
                        request.RelatedEntityName,
                        request.RelatedEntityCode,
                        result.ErrorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Notification publish exception. Category={Category}, Entity={EntityName}, Code={EntityCode}",
                    request.NotifCategory,
                    request.RelatedEntityName,
                    request.RelatedEntityCode);
            }
        }
    }
}

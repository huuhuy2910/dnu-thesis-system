using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Hubs;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.Notifications
{
    public class CreateNotificationCommand : ICreateNotificationCommand
    {
        private readonly IUnitOfWork _uow;
        private readonly ICodeGenerator _codeGenerator;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public CreateNotificationCommand(
            IUnitOfWork uow,
            ICodeGenerator codeGenerator,
            ICurrentUserService currentUserService,
            IHubContext<NotificationHub> hubContext)
        {
            _uow = uow;
            _codeGenerator = codeGenerator;
            _currentUserService = currentUserService;
            _hubContext = hubContext;
        }

        public async Task<OperationResult<NotificationRecipientReadDto>> ExecuteAsync(CreateNotificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NotifCategory) || string.IsNullOrWhiteSpace(dto.NotifTitle) || string.IsNullOrWhiteSpace(dto.NotifBody))
                return OperationResult<NotificationRecipientReadDto>.Failed("notifCategory, notifTitle, notifBody are required", 400);

            var actorUserId = _currentUserService.GetUserId();
            var actorUserCode = _currentUserService.GetUserCode();

            var targetCodes = (dto.TargetUserCodes ?? new List<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!dto.IsGlobal && targetCodes.Count == 0)
                return OperationResult<NotificationRecipientReadDto>.Failed("targetUserCodes is required when isGlobal=false", 400);

            var targets = dto.IsGlobal
                ? await _uow.Users.Query().Select(x => new { x.UserID, x.UserCode }).ToListAsync()
                : await _uow.Users.Query().Where(x => targetCodes.Contains(x.UserCode)).Select(x => new { x.UserID, x.UserCode }).ToListAsync();

            if (targets.Count == 0)
                return OperationResult<NotificationRecipientReadDto>.Failed("No target users found", 404);

            var effectiveImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
                ? await ResolveActorAvatarUrlAsync(actorUserCode, actorUserId)
                : dto.ImageUrl;

            var notification = new Notification
            {
                NotificationCode = _codeGenerator.Generate("NTF"),
                NotifChannel = string.IsNullOrWhiteSpace(dto.NotifChannel) ? "IN_APP" : dto.NotifChannel!,
                NotifCategory = dto.NotifCategory,
                NotifTitle = dto.NotifTitle,
                NotifBody = dto.NotifBody,
                NotifPriority = string.IsNullOrWhiteSpace(dto.NotifPriority) ? "NORMAL" : dto.NotifPriority!,
                ActionType = dto.ActionType,
                ActionUrl = dto.ActionUrl,
                ImageUrl = effectiveImageUrl,
                RelatedEntityName = dto.RelatedEntityName,
                RelatedEntityCode = dto.RelatedEntityCode,
                RelatedEntityID = dto.RelatedEntityID,
                TriggeredByUserID = actorUserId,
                TriggeredByUserCode = actorUserCode,
                IsGlobal = dto.IsGlobal ? 1 : 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _uow.Notifications.AddAsync(notification);
            await _uow.SaveChangesAsync();

            var recipients = targets.Select(t => new NotificationRecipient
            {
                NotificationID = notification.NotificationID,
                TargetUserID = t.UserID,
                TargetUserCode = t.UserCode,
                DeliveryState = "PENDING",
                IsRead = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            foreach (var recipient in recipients)
            {
                await _uow.NotificationRecipients.AddAsync(recipient);
            }

            var outboxPayload = JsonSerializer.Serialize(new
            {
                NotificationCode = notification.NotificationCode,
                notification.NotifCategory,
                notification.NotifTitle,
                notification.ActionUrl,
                recipients = recipients.Select(x => new { x.TargetUserCode, x.RecipientID }).ToList()
            });

            await _uow.NotificationOutbox.AddAsync(new NotificationOutbox
            {
                EventType = "NOTIFICATION_CREATED",
                PayloadJson = outboxPayload,
                OutboxStatus = "PENDING",
                RetryCount = 0,
                CreatedAt = DateTime.UtcNow
            });

            await _uow.SaveChangesAsync();

            foreach (var recipient in recipients)
            {
                recipient.DeliveryState = "DELIVERED";
                recipient.DeliveredAt = DateTime.UtcNow;
                recipient.UpdatedAt = DateTime.UtcNow;
                _uow.NotificationRecipients.Update(recipient);
            }
            await _uow.SaveChangesAsync();

            foreach (var recipient in recipients)
            {
                var unreadCount = await _uow.NotificationRecipients.Query()
                    .Where(x => x.TargetUserID == recipient.TargetUserID && x.IsRead == 0 && !x.DismissedAt.HasValue)
                    .CountAsync();

                var realtime = new NotificationRealtimeDto(
                    recipient.RecipientID,
                    notification.NotificationCode,
                    notification.NotifCategory,
                    notification.NotifTitle,
                    notification.ActionUrl,
                    notification.NotifPriority,
                    false,
                    notification.CreatedAt.ToString("O"),
                    unreadCount);

                await _hubContext.Clients
                    .Group(NotificationHubGroups.User(recipient.TargetUserCode))
                    .SendAsync("notification.created", realtime);
            }

            var first = recipients[0];

            var response = new NotificationRecipientReadDto(
                first.RecipientID,
                notification.NotificationID,
                first.TargetUserID,
                first.TargetUserCode,
                first.DeliveryState,
                false,
                null,
                null,
                null,
                first.CreatedAt,
                new NotificationReadDto(
                    notification.NotificationID,
                    notification.NotificationCode,
                    notification.NotifChannel,
                    notification.NotifCategory,
                    notification.NotifTitle,
                    notification.NotifBody,
                    notification.NotifPriority,
                    notification.ActionType,
                    notification.ActionUrl,
                    notification.ImageUrl,
                    notification.RelatedEntityName,
                    notification.RelatedEntityCode,
                    notification.RelatedEntityID,
                    notification.TriggeredByUserCode,
                    notification.IsGlobal == 1,
                    notification.CreatedAt,
                    notification.ExpiresAt));

            return OperationResult<NotificationRecipientReadDto>.Succeeded(response, 201);
        }

        private async Task<string?> ResolveActorAvatarUrlAsync(string? actorUserCode, int? actorUserId)
        {
            if (!string.IsNullOrWhiteSpace(actorUserCode))
            {
                var studentAvatarByCode = await _uow.StudentProfiles.Query()
                    .Where(x => x.UserCode == actorUserCode && x.StudentImage != null)
                    .Select(x => x.StudentImage)
                    .FirstOrDefaultAsync();
                if (!string.IsNullOrWhiteSpace(studentAvatarByCode))
                    return studentAvatarByCode;

                var lecturerAvatarByCode = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserCode == actorUserCode && x.ProfileImage != null)
                    .Select(x => x.ProfileImage)
                    .FirstOrDefaultAsync();
                if (!string.IsNullOrWhiteSpace(lecturerAvatarByCode))
                    return lecturerAvatarByCode;
            }

            if (actorUserId.HasValue)
            {
                var studentAvatarById = await _uow.StudentProfiles.Query()
                    .Where(x => x.UserID == actorUserId.Value && x.StudentImage != null)
                    .Select(x => x.StudentImage)
                    .FirstOrDefaultAsync();
                if (!string.IsNullOrWhiteSpace(studentAvatarById))
                    return studentAvatarById;

                var lecturerAvatarById = await _uow.LecturerProfiles.Query()
                    .Where(x => x.UserID == actorUserId.Value && x.ProfileImage != null)
                    .Select(x => x.ProfileImage)
                    .FirstOrDefaultAsync();
                if (!string.IsNullOrWhiteSpace(lecturerAvatarById))
                    return lecturerAvatarById;
            }

            return null;
        }
    }
}

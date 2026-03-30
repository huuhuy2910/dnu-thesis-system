using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Command.Notifications;
using ThesisManagement.Api.Application.Query.Notifications;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.Notifications.Command;
using ThesisManagement.Api.DTOs.Notifications.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    public class NotificationsController : BaseApiController
    {
        private readonly IGetMyNotificationsListQuery _getMyNotificationsListQuery;
        private readonly IGetMyUnreadCountQuery _getMyUnreadCountQuery;
        private readonly IGetMyNotificationPreferencesQuery _getMyNotificationPreferencesQuery;
        private readonly ICreateNotificationCommand _createNotificationCommand;
        private readonly IMarkNotificationReadCommand _markNotificationReadCommand;
        private readonly IMarkAllNotificationsReadCommand _markAllNotificationsReadCommand;
        private readonly IUpdateMyNotificationPreferenceCommand _updateMyNotificationPreferenceCommand;

        public NotificationsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetMyNotificationsListQuery getMyNotificationsListQuery,
            IGetMyUnreadCountQuery getMyUnreadCountQuery,
            IGetMyNotificationPreferencesQuery getMyNotificationPreferencesQuery,
            ICreateNotificationCommand createNotificationCommand,
            IMarkNotificationReadCommand markNotificationReadCommand,
            IMarkAllNotificationsReadCommand markAllNotificationsReadCommand,
            IUpdateMyNotificationPreferenceCommand updateMyNotificationPreferenceCommand) : base(uow, codeGen, mapper)
        {
            _getMyNotificationsListQuery = getMyNotificationsListQuery;
            _getMyUnreadCountQuery = getMyUnreadCountQuery;
            _getMyNotificationPreferencesQuery = getMyNotificationPreferencesQuery;
            _createNotificationCommand = createNotificationCommand;
            _markNotificationReadCommand = markNotificationReadCommand;
            _markAllNotificationsReadCommand = markAllNotificationsReadCommand;
            _updateMyNotificationPreferenceCommand = updateMyNotificationPreferenceCommand;
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMy([FromQuery] NotificationFilter filter)
        {
            var result = await _getMyNotificationsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<NotificationRecipientReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        [HttpGet("my/unread-count")]
        public async Task<IActionResult> GetMyUnreadCount()
        {
            var dto = await _getMyUnreadCountQuery.ExecuteAsync();
            return Ok(ApiResponse<NotificationUnreadCountDto>.SuccessResponse(dto));
        }

        [HttpPut("my/{recipientId:int}/read")]
        public async Task<IActionResult> MarkRead(int recipientId)
        {
            var result = await _markNotificationReadCommand.ExecuteAsync(new MarkReadDto(recipientId));
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<NotificationUnreadCountDto>.SuccessResponse(result.Data));
        }

        [HttpPut("my/read-all")]
        public async Task<IActionResult> MarkReadAll([FromBody] MarkReadAllDto dto)
        {
            var result = await _markAllNotificationsReadCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<NotificationUnreadCountDto>.SuccessResponse(result.Data));
        }

        [HttpGet("preferences/my")]
        public async Task<IActionResult> GetMyPreferences([FromQuery] NotificationPreferenceFilter filter)
        {
            var items = await _getMyNotificationPreferencesQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<NotificationPreferenceReadDto>>.SuccessResponse(items, items.Count()));
        }

        [HttpPut("preferences/my/{notifCategory}")]
        public async Task<IActionResult> UpdateMyPreference(string notifCategory, [FromBody] UpdateNotificationPreferenceDto dto)
        {
            var result = await _updateMyNotificationPreferenceCommand.ExecuteAsync(notifCategory, dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return Ok(ApiResponse<NotificationPreferenceReadDto>.SuccessResponse(result.Data));
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateNotificationDto dto)
        {
            var result = await _createNotificationCommand.ExecuteAsync(dto);
            if (!result.Success)
                return StatusCode(result.StatusCode, ApiResponse<object>.Fail(result.ErrorMessage ?? "Request failed", result.StatusCode));

            return StatusCode(result.StatusCode, ApiResponse<NotificationRecipientReadDto>.SuccessResponse(result.Data, 1, result.StatusCode));
        }
    }
}

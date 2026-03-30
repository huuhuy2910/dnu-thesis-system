using System.Text.Json;
using ThesisManagement.Api.Application.Common.Resilience;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Command.DefensePeriods.Services
{
    public interface IDefenseAuditTrailService
    {
        Task WriteAsync(
            string action,
            string result,
            object? before,
            object? after,
            object? details,
            int? actorUserId,
            CancellationToken cancellationToken = default);
    }

    public sealed class DefenseAuditTrailService : IDefenseAuditTrailService
    {
        private readonly ThesisManagement.Api.Services.IUnitOfWork _uow;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IDefenseResiliencePolicy _resiliencePolicy;

        public DefenseAuditTrailService(
            ThesisManagement.Api.Services.IUnitOfWork uow,
            ICurrentUserService currentUserService,
            IHttpContextAccessor httpContextAccessor,
            IDefenseResiliencePolicy resiliencePolicy)
        {
            _uow = uow;
            _currentUserService = currentUserService;
            _httpContextAccessor = httpContextAccessor;
            _resiliencePolicy = resiliencePolicy;
        }

        public async Task WriteAsync(
            string action,
            string result,
            object? before,
            object? after,
            object? details,
            int? actorUserId,
            CancellationToken cancellationToken = default)
        {
            var ctx = _httpContextAccessor.HttpContext;
            var actionType = ResolveActionType(action);
            var payload = new
            {
                ActionType = actionType,
                Before = before,
                After = after,
                Details = details,
                Actor = new
                {
                    ActorUserId = actorUserId,
                    ContextUserId = _currentUserService.GetUserId(),
                    UserCode = _currentUserService.GetUserCode(),
                    UserRole = _currentUserService.GetUserRole()
                },
                Trace = new
                {
                    CorrelationId = ctx?.TraceIdentifier,
                    RequestId = ctx?.Request?.Headers["X-Request-ID"].FirstOrDefault(),
                    IdempotencyKey = ctx?.Request?.Headers["Idempotency-Key"].FirstOrDefault(),
                    Method = ctx?.Request?.Method,
                    Path = ctx?.Request?.Path.Value,
                    Query = ctx?.Request?.QueryString.Value,
                    IpAddress = _currentUserService.GetIpAddress(),
                    DeviceInfo = _currentUserService.GetDeviceInfo(),
                    UserAgent = ctx?.Request?.Headers["User-Agent"].FirstOrDefault()
                }
            };

            var recordsJson = JsonSerializer.Serialize(payload);
            if (recordsJson.Length > 3900)
            {
                recordsJson = recordsJson.Substring(0, 3900);
            }

            await _resiliencePolicy.ExecuteAsync("DEFENSE_AUDIT_WRITE", async ct =>
            {
                await _uow.SyncAuditLogs.AddAsync(new SyncAuditLog
                {
                    Action = action,
                    Result = result,
                    Records = recordsJson,
                    Timestamp = DateTime.UtcNow
                });

                await _uow.SaveChangesAsync();
            }, cancellationToken);
        }

        private static string ResolveActionType(string? action)
        {
            if (string.IsNullOrWhiteSpace(action))
            {
                return "OTHER";
            }

            var key = action.Trim().ToUpperInvariant();

            if (key.Contains("SUBMIT") && key.Contains("SCORE")) return "SUBMIT_SCORE";
            if (key.Contains("LOCK") && key.Contains("SESSION")) return "LOCK_SESSION";
            if ((key.Contains("APPROVE") && key.Contains("REVISION")) || key == "REVISION_APPROVE") return "APPROVE_REVISION";
            if ((key.Contains("REJECT") && key.Contains("REVISION")) || key == "REVISION_REJECT") return "REJECT_REVISION";
            if (key.Contains("PUBLISH")) return "PUBLISH";
            if (key.Contains("ROLLBACK")) return "ROLLBACK";
            if (key.Contains("CREATE")) return "CREATE";
            if (key.Contains("UPDATE")) return "UPDATE";
            if (key.Contains("DELETE") || key.Contains("REMOVE")) return "DELETE";

            return "OTHER";
        }
    }
}

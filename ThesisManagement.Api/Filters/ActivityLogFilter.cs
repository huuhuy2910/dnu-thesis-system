using Microsoft.AspNetCore.Mvc.Filters;
using ThesisManagement.Api.Models;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Filters
{
    /// <summary>
    /// Action filter để tự động ghi log các hoạt động đặc biệt như LOGIN, LOGOUT
    /// </summary>
    public class ActivityLogFilter : IAsyncActionFilter
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IServiceProvider _serviceProvider;

        public ActivityLogFilter(ICurrentUserService currentUserService, IServiceProvider serviceProvider)
        {
            _currentUserService = currentUserService;
            _serviceProvider = serviceProvider;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Execute action
            var resultContext = await next();

            // Chỉ log khi action thành công (status code 2xx)
            if (resultContext.HttpContext.Response.StatusCode >= 200 && 
                resultContext.HttpContext.Response.StatusCode < 300)
            {
                var actionName = context.ActionDescriptor.RouteValues["action"];
                var controllerName = context.ActionDescriptor.RouteValues["controller"];

                // Chỉ log các action đặc biệt
                if (controllerName == "Auth" && actionName == "Login")
                {
                    await LogLoginActivity(context, resultContext);
                }
            }
        }

        private async Task LogLoginActivity(ActionExecutingContext context, ActionExecutedContext resultContext)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var log = new SystemActivityLog
                {
                    EntityName = "User",
                    EntityID = _currentUserService.GetUserCode(),
                    ActionType = "LOGIN",
                    ActionDescription = "Đăng nhập thành công vào hệ thống",
                    UserID = _currentUserService.GetUserId(),
                    UserCode = _currentUserService.GetUserCode() ?? "Unknown",
                    UserRole = _currentUserService.GetUserRole() ?? "Unknown",
                    IPAddress = _currentUserService.GetIpAddress(),
                    DeviceInfo = _currentUserService.GetDeviceInfo(),
                    Module = "Authentication",
                    PerformedAt = DateTime.UtcNow,
                    Status = "SUCCESS"
                };

                await uow.SystemActivityLogs.AddAsync(log);
                await uow.SaveChangesAsync();
            }
            catch
            {
                // Không throw exception nếu logging fail để không ảnh hưởng đến logic chính
            }
        }
    }
}

namespace ThesisManagement.Api.Middleware
{
    /// <summary>
    /// Middleware để lưu thông tin user vào HttpContext sau khi authenticate
    /// Sử dụng khi không có JWT, lấy từ header hoặc session
    /// </summary>
    public class UserContextMiddleware
    {
        private readonly RequestDelegate _next;

        public UserContextMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Lấy thông tin user từ headers (được set từ frontend sau khi login)
            if (context.Request.Headers.TryGetValue("X-User-ID", out var userIdValue))
            {
                if (int.TryParse(userIdValue, out var userId))
                {
                    context.Items["UserId"] = userId;
                }
            }

            if (context.Request.Headers.TryGetValue("X-User-Code", out var userCode))
            {
                context.Items["UserCode"] = userCode.ToString();
            }

            if (context.Request.Headers.TryGetValue("X-User-Role", out var userRole))
            {
                context.Items["UserRole"] = userRole.ToString();
            }

            await _next(context);
        }
    }
}

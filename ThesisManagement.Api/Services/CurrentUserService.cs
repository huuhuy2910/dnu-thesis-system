using System.Security.Claims;

namespace ThesisManagement.Api.Services
{
    /// <summary>
    /// Interface để lấy thông tin người dùng hiện tại từ HTTP context
    /// </summary>
    public interface ICurrentUserService
    {
        int? GetUserId();
        string? GetUserCode();
        string? GetUserRole();
        string? GetIpAddress();
        string? GetDeviceInfo();
        void SetCurrentUser(int userId, string userCode, string userRole);
    }

    /// <summary>
    /// Service triển khai lấy thông tin người dùng hiện tại
    /// </summary>
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? GetUserId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Thử lấy từ HttpContext.Items trước (từ middleware hoặc được set thủ công)
            if (context.Items.TryGetValue("UserId", out var userIdObj) && userIdObj is int userId)
            {
                return userId;
            }

            // Fallback: thử lấy từ Claims (nếu có JWT)
            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var claimUserId))
            {
                return claimUserId;
            }

            // Fallback: thử lấy từ header
            if (context.Request.Headers.TryGetValue("X-User-ID", out var userIdHeader))
            {
                if (int.TryParse(userIdHeader, out var headerUserId))
                {
                    return headerUserId;
                }
            }

            return null;
        }

        public string? GetUserCode()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Thử lấy từ HttpContext.Items trước
            if (context.Items.TryGetValue("UserCode", out var userCodeObj) && userCodeObj is string userCode)
            {
                return userCode;
            }

            // Fallback: thử lấy từ Claims
            var claimUserCode = context.User?.FindFirst(ClaimTypes.Name)?.Value;
            if (!string.IsNullOrEmpty(claimUserCode))
            {
                return claimUserCode;
            }

            // Fallback: thử lấy từ header
            if (context.Request.Headers.TryGetValue("X-User-Code", out var userCodeHeader))
            {
                return userCodeHeader.ToString();
            }

            return null;
        }

        public string? GetUserRole()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Thử lấy từ HttpContext.Items trước
            if (context.Items.TryGetValue("UserRole", out var userRoleObj) && userRoleObj is string userRole)
            {
                return userRole;
            }

            // Fallback: thử lấy từ Claims
            var claimRole = context.User?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(claimRole))
            {
                return claimRole;
            }

            // Fallback: thử lấy từ header
            if (context.Request.Headers.TryGetValue("X-User-Role", out var roleHeader))
            {
                return roleHeader.ToString();
            }

            return null;
        }

        public void SetCurrentUser(int userId, string userCode, string userRole)
        {
            var context = _httpContextAccessor.HttpContext;
            if (context != null)
            {
                context.Items["UserId"] = userId;
                context.Items["UserCode"] = userCode;
                context.Items["UserRole"] = userRole;
            }
        }

        public string? GetIpAddress()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Kiểm tra proxy headers trước
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',').First().Trim();
            }

            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // Fallback to remote IP
            return context.Connection.RemoteIpAddress?.ToString();
        }

        public string? GetDeviceInfo()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
            if (string.IsNullOrEmpty(userAgent)) return null;

            // Parse User-Agent để lấy thông tin browser và OS
            return ParseUserAgent(userAgent);
        }

        private string ParseUserAgent(string userAgent)
        {
            // Đơn giản hóa User-Agent string
            if (userAgent.Contains("Chrome") && !userAgent.Contains("Edg"))
                return $"Chrome on {GetOS(userAgent)}";
            if (userAgent.Contains("Firefox"))
                return $"Firefox on {GetOS(userAgent)}";
            if (userAgent.Contains("Safari") && !userAgent.Contains("Chrome"))
                return $"Safari on {GetOS(userAgent)}";
            if (userAgent.Contains("Edg"))
                return $"Edge on {GetOS(userAgent)}";

            return userAgent.Length > 100 ? userAgent.Substring(0, 100) : userAgent;
        }

        private string GetOS(string userAgent)
        {
            if (userAgent.Contains("Windows NT 10.0")) return "Windows 10/11";
            if (userAgent.Contains("Windows NT 6.3")) return "Windows 8.1";
            if (userAgent.Contains("Windows NT 6.1")) return "Windows 7";
            if (userAgent.Contains("Mac OS X")) return "macOS";
            if (userAgent.Contains("Android")) return "Android";
            if (userAgent.Contains("iPhone") || userAgent.Contains("iPad")) return "iOS";
            if (userAgent.Contains("Linux")) return "Linux";
            return "Unknown OS";
        }
    }
}

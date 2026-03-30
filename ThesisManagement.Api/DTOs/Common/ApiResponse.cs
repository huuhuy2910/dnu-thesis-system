namespace ThesisManagement.Api.DTOs
{
    public class ApiWarning
    {
        public string Type { get; set; } = "soft";
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; } = true;
        public object? Code { get; set; } = null;
        public int HttpStatusCode { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public int TotalCount { get; set; }
        public bool IsRedirect { get; set; } = false;
        public string? RedirectUrl { get; set; }
        public object? Errors { get; set; }
        public List<ApiWarning> Warnings { get; set; } = new();
        public string? TraceId { get; set; } = System.Diagnostics.Activity.Current?.Id ?? Guid.NewGuid().ToString("N");
        public bool IdempotencyReplay { get; set; }
        public string? ConcurrencyToken { get; set; }
        public List<string> AllowedActions { get; set; } = new();

        public static ApiResponse<T> SuccessResponse(
            T? data,
            int totalCount = 0,
            int httpStatusCode = 200,
            object? code = null,
            List<ApiWarning>? warnings = null,
            bool idempotencyReplay = false,
            string? concurrencyToken = null,
            List<string>? allowedActions = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                HttpStatusCode = httpStatusCode,
                Data = data,
                TotalCount = totalCount,
                Errors = null,
                Code = code,
                Warnings = warnings ?? new List<ApiWarning>(),
                IdempotencyReplay = idempotencyReplay,
                ConcurrencyToken = concurrencyToken,
                AllowedActions = allowedActions ?? new List<string>(),
                TraceId = System.Diagnostics.Activity.Current?.Id ?? Guid.NewGuid().ToString("N")
            };
        }

        public static ApiResponse<T> Fail(
            string message,
            int httpStatusCode = 400,
            object? errors = null,
            object? code = null,
            List<ApiWarning>? warnings = null,
            List<string>? allowedActions = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                HttpStatusCode = httpStatusCode,
                Errors = errors,
                Code = code,
                Warnings = warnings ?? new List<ApiWarning>(),
                AllowedActions = allowedActions ?? new List<string>(),
                TraceId = System.Diagnostics.Activity.Current?.Id ?? Guid.NewGuid().ToString("N")
            };
        }
    }
}

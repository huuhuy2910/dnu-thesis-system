namespace ThesisManagement.Api.DTOs
{
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
        public object? Errors { get; set; } = new { };

        public static ApiResponse<T> SuccessResponse(T? data, int totalCount = 0, int httpStatusCode = 200)
        {
            return new ApiResponse<T>
            {
                Success = true,
                HttpStatusCode = httpStatusCode,
                Data = data,
                TotalCount = totalCount
            };
        }

        public static ApiResponse<T> Fail(string message, int httpStatusCode = 400, object? errors = null)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                HttpStatusCode = httpStatusCode,
                Errors = errors ?? new { }
            };
        }
    }
}

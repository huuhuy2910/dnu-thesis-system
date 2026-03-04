namespace ThesisManagement.Api.Application.Common
{
    public sealed class OperationResult<T>
    {
        public bool Success { get; init; }
        public int StatusCode { get; init; }
        public string? ErrorMessage { get; init; }
        public T? Data { get; init; }

        public static OperationResult<T> Succeeded(T? data, int statusCode = 200)
            => new()
            {
                Success = true,
                StatusCode = statusCode,
                Data = data
            };

        public static OperationResult<T> Failed(string message, int statusCode = 400)
            => new()
            {
                Success = false,
                StatusCode = statusCode,
                ErrorMessage = message
            };
    }
}

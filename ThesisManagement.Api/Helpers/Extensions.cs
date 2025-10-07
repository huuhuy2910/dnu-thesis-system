using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;

namespace ThesisManagement.Api.Helpers
{
    public static class Extensions
    {
        // Helper to quickly return ApiResponse from controller
        public static ActionResult<ApiResponse<T>> ToApiResponse<T>(this T? data, int totalCount = 0, int statusCode = 200)
        {
            var resp = ApiResponse<T>.SuccessResponse(data, totalCount, statusCode);
            return new ObjectResult(resp) { StatusCode = statusCode };
        }
    }
}

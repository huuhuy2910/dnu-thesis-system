using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ThesisManagement.Api.Filters
{
    public sealed class ApiResponseSignalFilter : IAsyncResultFilter
    {
        public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
        {
            if (context.Result is ObjectResult objectResult && objectResult.Value != null)
            {
                var valueType = objectResult.Value.GetType();

                var replay = ReadProperty<bool?>(objectResult.Value, valueType, "IdempotencyReplay") ?? false;
                var code = ReadProperty<object?>(objectResult.Value, valueType, "Code");
                var traceId = ReadProperty<string?>(objectResult.Value, valueType, "TraceId");

                context.HttpContext.Response.Headers["X-Idempotency-Replay"] = replay ? "true" : "false";
                if (code != null)
                {
                    context.HttpContext.Response.Headers["X-Response-Code"] = code.ToString();
                }

                if (!string.IsNullOrWhiteSpace(traceId))
                {
                    context.HttpContext.Response.Headers["X-Trace-Id"] = traceId;
                }
            }

            await next();
        }

        private static TProperty? ReadProperty<TProperty>(object instance, Type type, string propertyName)
        {
            var property = type.GetProperty(propertyName);
            if (property == null)
            {
                return default;
            }

            var value = property.GetValue(instance);
            if (value is TProperty typed)
            {
                return typed;
            }

            return default;
        }
    }
}

using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Routing;

namespace ThesisManagement.Api.Helpers
{
    public sealed class ApiObservabilityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ApiObservabilityMiddleware> _logger;
        private readonly IApiRuntimeMetricsStore _metricsStore;
        private const long SlowRequestThresholdMs = 1200;

        public ApiObservabilityMiddleware(
            RequestDelegate next,
            ILogger<ApiObservabilityMiddleware> logger,
            IApiRuntimeMetricsStore metricsStore)
        {
            _next = next;
            _logger = logger;
            _metricsStore = metricsStore;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

            var headerIdempotencyKey = context.Request.Headers["Idempotency-Key"].FirstOrDefault();
            var bodyIdempotencyKey = await TryReadBodyIdempotencyKeyAsync(context);
            var signalSource = ResolveSignalSource(headerIdempotencyKey, bodyIdempotencyKey);
            var idempotencyKeyHash = signalSource == IdempotencySignalSource.None
                ? null
                : ComputeStableShortHash(headerIdempotencyKey ?? bodyIdempotencyKey);

            var sw = Stopwatch.StartNew();
            context.Response.OnStarting(static stateObj =>
            {
                var state = ((HttpContext Context, string TraceId, IdempotencySignalSource SignalSource, string? KeyHash, Stopwatch Stopwatch))stateObj;
                var headers = state.Context.Response.Headers;

                headers["X-Trace-Id"] = state.TraceId;
                headers["X-Request-Id"] = state.Context.TraceIdentifier;
                headers["X-Request-Idempotency-Signal"] = state.SignalSource.ToString();
                headers["X-Response-Time-Ms"] = state.Stopwatch.ElapsedMilliseconds.ToString();

                if (!string.IsNullOrWhiteSpace(state.KeyHash))
                {
                    headers["X-Request-Idempotency-Key-Hash"] = state.KeyHash;
                }

                return Task.CompletedTask;
            }, (context, traceId, signalSource, idempotencyKeyHash, sw));

            try
            {
                await _next(context);
            }
            finally
            {
                sw.Stop();

                var isReplay = string.Equals(context.Response.Headers["X-Idempotency-Replay"], "true", StringComparison.OrdinalIgnoreCase);
                var responseCode = context.Response.Headers["X-Response-Code"].ToString();
                var endpointPattern = ResolveEndpointPattern(context);
                var endpointGroup = ResolveEndpointGroup(endpointPattern, context.Request.Path);

                _metricsStore.RecordRequest(
                    context.Request.Method,
                    context.Request.Path,
                    endpointPattern,
                    endpointGroup,
                    context.Response.StatusCode,
                    sw.ElapsedMilliseconds,
                    responseCode,
                    signalSource,
                    isReplay);

                if (sw.ElapsedMilliseconds >= SlowRequestThresholdMs)
                {
                    _logger.LogWarning(
                        "Slow request detected: {Method} {Path} -> {StatusCode} in {ElapsedMs}ms (TraceId={TraceId})",
                        context.Request.Method,
                        context.Request.Path,
                        context.Response.StatusCode,
                        sw.ElapsedMilliseconds,
                        traceId);
                }
            }
        }

        private static string ResolveEndpointPattern(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            if (endpoint is RouteEndpoint routeEndpoint && !string.IsNullOrWhiteSpace(routeEndpoint.RoutePattern.RawText))
            {
                return routeEndpoint.RoutePattern.RawText!;
            }

            return context.Request.Path.Value ?? "unknown";
        }

        private static string ResolveEndpointGroup(string endpointPattern, PathString requestPath)
        {
            var raw = string.IsNullOrWhiteSpace(endpointPattern) ? requestPath.Value ?? string.Empty : endpointPattern;
            var normalized = raw.Trim('/');
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return "Root";
            }

            var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length >= 3 && string.Equals(segments[0], "api", StringComparison.OrdinalIgnoreCase) && segments[1].StartsWith("v", StringComparison.OrdinalIgnoreCase))
            {
                return segments[2];
            }

            return segments[0];
        }

        private static IdempotencySignalSource ResolveSignalSource(string? headerKey, string? bodyKey)
        {
            var hasHeader = !string.IsNullOrWhiteSpace(headerKey);
            var hasBody = !string.IsNullOrWhiteSpace(bodyKey);

            if (hasHeader && hasBody)
            {
                return IdempotencySignalSource.HeaderAndBody;
            }

            if (hasHeader)
            {
                return IdempotencySignalSource.Header;
            }

            if (hasBody)
            {
                return IdempotencySignalSource.Body;
            }

            return IdempotencySignalSource.None;
        }

        private static async Task<string?> TryReadBodyIdempotencyKeyAsync(HttpContext context)
        {
            if (!HttpMethods.IsPost(context.Request.Method)
                && !HttpMethods.IsPut(context.Request.Method)
                && !HttpMethods.IsPatch(context.Request.Method)
                && !HttpMethods.IsDelete(context.Request.Method))
            {
                return null;
            }

            if (context.Request.ContentLength is null || context.Request.ContentLength <= 0 || context.Request.ContentLength > 1024 * 1024)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(context.Request.ContentType)
                || !context.Request.ContentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            context.Request.EnableBuffering();
            try
            {
                using var document = await JsonDocument.ParseAsync(context.Request.Body);
                if (TryExtractIdempotencyKey(document.RootElement, out var key))
                {
                    return key;
                }
            }
            catch
            {
                return null;
            }
            finally
            {
                context.Request.Body.Position = 0;
            }

            return null;
        }

        private static bool TryExtractIdempotencyKey(JsonElement element, out string? value)
        {
            value = null;

            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                {
                    foreach (var property in element.EnumerateObject())
                    {
                        if (string.Equals(property.Name, "idempotencyKey", StringComparison.OrdinalIgnoreCase)
                            && property.Value.ValueKind == JsonValueKind.String)
                        {
                            value = property.Value.GetString();
                            if (!string.IsNullOrWhiteSpace(value))
                            {
                                return true;
                            }
                        }

                        if (TryExtractIdempotencyKey(property.Value, out value))
                        {
                            return true;
                        }
                    }

                    return false;
                }
                case JsonValueKind.Array:
                {
                    foreach (var item in element.EnumerateArray())
                    {
                        if (TryExtractIdempotencyKey(item, out value))
                        {
                            return true;
                        }
                    }

                    return false;
                }
                default:
                    return false;
            }
        }

        private static string ComputeStableShortHash(string? raw)
        {
            var payload = raw ?? string.Empty;
            var bytes = Encoding.UTF8.GetBytes(payload);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash)[..16];
        }
    }
}

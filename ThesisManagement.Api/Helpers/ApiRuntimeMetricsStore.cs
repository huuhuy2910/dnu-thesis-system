using System.Collections.Concurrent;

namespace ThesisManagement.Api.Helpers
{
    public enum IdempotencySignalSource
    {
        None = 0,
        Header = 1,
        Body = 2,
        HeaderAndBody = 3
    }

    public interface IApiRuntimeMetricsStore
    {
        void RecordRequest(
            string method,
            PathString path,
            string endpointPattern,
            string endpointGroup,
            int statusCode,
            long elapsedMs,
            string? responseCode,
            IdempotencySignalSource signalSource,
            bool isReplay);

        ApiRuntimeMetricsSnapshot Snapshot();
    }

    public sealed class ApiRuntimeMetricsStore : IApiRuntimeMetricsStore
    {
        private long _totalRequests;
        private long _slowRequests;
        private long _conflictResponses;
        private long _rollbackRequests;
        private long _idempotentRequests;
        private long _replayResponses;

        private readonly ConcurrentDictionary<int, long> _statusCounters = new();
        private readonly ConcurrentDictionary<string, EndpointMetricsCounter> _endpointCounters = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, EndpointMetricsCounter> _groupCounters = new(StringComparer.OrdinalIgnoreCase);

        public void RecordRequest(
            string method,
            PathString path,
            string endpointPattern,
            string endpointGroup,
            int statusCode,
            long elapsedMs,
            string? responseCode,
            IdempotencySignalSource signalSource,
            bool isReplay)
        {
            Interlocked.Increment(ref _totalRequests);
            _statusCounters.AddOrUpdate(statusCode, 1, (_, current) => current + 1);

            if (elapsedMs >= 1200)
            {
                Interlocked.Increment(ref _slowRequests);
            }

            if (statusCode == StatusCodes.Status409Conflict)
            {
                Interlocked.Increment(ref _conflictResponses);
            }

            if (path.Value?.Contains("rollback", StringComparison.OrdinalIgnoreCase) == true)
            {
                Interlocked.Increment(ref _rollbackRequests);
            }

            if (signalSource != IdempotencySignalSource.None)
            {
                Interlocked.Increment(ref _idempotentRequests);
            }

            if (isReplay)
            {
                Interlocked.Increment(ref _replayResponses);
            }

            var endpointKey = string.IsNullOrWhiteSpace(endpointPattern)
                ? $"{method} {path.Value ?? string.Empty}"
                : $"{method} {endpointPattern}";

            var endpointCounter = _endpointCounters.GetOrAdd(endpointKey, _ => new EndpointMetricsCounter());
            endpointCounter.Record(statusCode, elapsedMs, responseCode, signalSource, isReplay);

            var groupKey = string.IsNullOrWhiteSpace(endpointGroup) ? "Other" : endpointGroup;
            var groupCounter = _groupCounters.GetOrAdd(groupKey, _ => new EndpointMetricsCounter());
            groupCounter.Record(statusCode, elapsedMs, responseCode, signalSource, isReplay);
        }

        public ApiRuntimeMetricsSnapshot Snapshot()
        {
            var endpointRows = _endpointCounters
                .OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
                .Select(x => x.Value.ToSnapshot(x.Key))
                .ToList();

            var groupRows = _groupCounters
                .OrderByDescending(x => x.Value.TotalRequests)
                .ThenBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
                .Select(x => new EndpointGroupMetricsSnapshot
                {
                    Group = x.Key,
                    Summary = x.Value.ToSnapshot(x.Key),
                    Endpoints = endpointRows
                        .Where(e => string.Equals(e.Group, x.Key, StringComparison.OrdinalIgnoreCase))
                        .OrderByDescending(e => e.TotalRequests)
                        .ThenBy(e => e.Endpoint, StringComparer.OrdinalIgnoreCase)
                        .ToList()
                })
                .ToList();

            return new ApiRuntimeMetricsSnapshot
            {
                CapturedAt = DateTime.UtcNow,
                TotalRequests = Interlocked.Read(ref _totalRequests),
                SlowRequests = Interlocked.Read(ref _slowRequests),
                ConflictResponses = Interlocked.Read(ref _conflictResponses),
                RollbackRequests = Interlocked.Read(ref _rollbackRequests),
                IdempotentRequests = Interlocked.Read(ref _idempotentRequests),
                ReplayResponses = Interlocked.Read(ref _replayResponses),
                StatusBuckets = _statusCounters.OrderBy(x => x.Key).ToDictionary(x => x.Key, x => x.Value),
                Groups = groupRows
            };
        }

        private sealed class EndpointMetricsCounter
        {
            private const long SlowRequestThresholdMs = 1200;
            private readonly ConcurrentDictionary<int, long> _statusBuckets = new();
            private readonly ConcurrentDictionary<string, long> _responseCodeBuckets = new(StringComparer.OrdinalIgnoreCase);
            private readonly ConcurrentDictionary<string, long> _signalBuckets = new(StringComparer.OrdinalIgnoreCase);

            private long _totalRequests;
            private long _slowRequests;
            private long _conflictResponses;
            private long _rollbackRequests;
            private long _replayResponses;

            public long TotalRequests => Interlocked.Read(ref _totalRequests);

            public void Record(int statusCode, long elapsedMs, string? responseCode, IdempotencySignalSource signalSource, bool isReplay)
            {
                Interlocked.Increment(ref _totalRequests);
                _statusBuckets.AddOrUpdate(statusCode, 1, (_, current) => current + 1);

                if (elapsedMs >= SlowRequestThresholdMs)
                {
                    Interlocked.Increment(ref _slowRequests);
                }

                if (statusCode == StatusCodes.Status409Conflict)
                {
                    Interlocked.Increment(ref _conflictResponses);
                }

                if (responseCode?.Contains("ROLLBACK", StringComparison.OrdinalIgnoreCase) == true)
                {
                    Interlocked.Increment(ref _rollbackRequests);
                }

                if (isReplay)
                {
                    Interlocked.Increment(ref _replayResponses);
                }

                if (!string.IsNullOrWhiteSpace(responseCode))
                {
                    _responseCodeBuckets.AddOrUpdate(responseCode, 1, (_, current) => current + 1);
                }

                _signalBuckets.AddOrUpdate(signalSource.ToString(), 1, (_, current) => current + 1);
            }

            public EndpointMetricsSnapshot ToSnapshot(string endpoint)
            {
                return new EndpointMetricsSnapshot
                {
                    Endpoint = endpoint,
                    Group = ResolveGroup(endpoint),
                    TotalRequests = Interlocked.Read(ref _totalRequests),
                    SlowRequests = Interlocked.Read(ref _slowRequests),
                    ConflictResponses = Interlocked.Read(ref _conflictResponses),
                    RollbackSignals = Interlocked.Read(ref _rollbackRequests),
                    ReplayResponses = Interlocked.Read(ref _replayResponses),
                    StatusBuckets = _statusBuckets.OrderBy(x => x.Key).ToDictionary(x => x.Key, x => x.Value),
                    ResponseCodeBuckets = _responseCodeBuckets.OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase).ToDictionary(x => x.Key, x => x.Value),
                    SignalBuckets = _signalBuckets.OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase).ToDictionary(x => x.Key, x => x.Value)
                };
            }

            private static string ResolveGroup(string endpoint)
            {
                var parts = endpoint.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length < 2)
                {
                    return "Other";
                }

                var path = parts[1].Trim('/');
                if (string.IsNullOrWhiteSpace(path))
                {
                    return "Root";
                }

                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                if (segments.Length >= 3 && string.Equals(segments[0], "api", StringComparison.OrdinalIgnoreCase) && segments[1].StartsWith("v", StringComparison.OrdinalIgnoreCase))
                {
                    return segments[2];
                }

                return segments[0];
            }
        }
    }

    public sealed class ApiRuntimeMetricsSnapshot
    {
        public DateTime CapturedAt { get; set; }
        public long TotalRequests { get; set; }
        public long SlowRequests { get; set; }
        public long ConflictResponses { get; set; }
        public long RollbackRequests { get; set; }
        public long IdempotentRequests { get; set; }
        public long ReplayResponses { get; set; }
        public Dictionary<int, long> StatusBuckets { get; set; } = new();
        public List<EndpointGroupMetricsSnapshot> Groups { get; set; } = new();
    }

    public sealed class EndpointGroupMetricsSnapshot
    {
        public string Group { get; set; } = string.Empty;
        public EndpointMetricsSnapshot Summary { get; set; } = new();
        public List<EndpointMetricsSnapshot> Endpoints { get; set; } = new();
    }

    public sealed class EndpointMetricsSnapshot
    {
        public string Endpoint { get; set; } = string.Empty;
        public string Group { get; set; } = string.Empty;
        public long TotalRequests { get; set; }
        public long SlowRequests { get; set; }
        public long ConflictResponses { get; set; }
        public long RollbackSignals { get; set; }
        public long ReplayResponses { get; set; }
        public Dictionary<int, long> StatusBuckets { get; set; } = new();
        public Dictionary<string, long> ResponseCodeBuckets { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, long> SignalBuckets { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }
}

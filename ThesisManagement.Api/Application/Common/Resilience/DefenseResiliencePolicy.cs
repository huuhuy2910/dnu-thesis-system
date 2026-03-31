using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;

namespace ThesisManagement.Api.Application.Common.Resilience
{
    public sealed class DefenseResiliencePolicyOptions
    {
        public int MaxRetries { get; set; } = 2;
        public int BaseDelayMs { get; set; } = 150;
        public int OperationTimeoutMs { get; set; } = 15000;
        public int CircuitFailureThreshold { get; set; } = 5;
        public int CircuitBreakSeconds { get; set; } = 30;
    }

    public interface IDefenseResiliencePolicy
    {
        Task ExecuteAsync(string operationName, Func<CancellationToken, Task> action, CancellationToken cancellationToken = default);
        Task<T> ExecuteAsync<T>(string operationName, Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default);
    }

    public sealed class DefenseResiliencePolicy : IDefenseResiliencePolicy
    {
        private sealed class CircuitState
        {
            public int ConsecutiveFailures { get; set; }
            public DateTime? OpenUntilUtc { get; set; }
        }

        private readonly DefenseResiliencePolicyOptions _options;
        private readonly ConcurrentDictionary<string, CircuitState> _circuits = new(StringComparer.OrdinalIgnoreCase);

        public DefenseResiliencePolicy(Microsoft.Extensions.Options.IOptions<DefenseResiliencePolicyOptions> options)
        {
            _options = options.Value ?? new DefenseResiliencePolicyOptions();
        }

        public async Task ExecuteAsync(string operationName, Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
        {
            await ExecuteAsync<object?>(operationName, async ct =>
            {
                await action(ct);
                return null;
            }, cancellationToken);
        }

        public async Task<T> ExecuteAsync<T>(string operationName, Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(operationName))
            {
                operationName = "DEFENSE_OPERATION";
            }

            var circuit = _circuits.GetOrAdd(operationName, _ => new CircuitState());
            EnsureCircuitClosed(operationName, circuit);

            var maxAttempts = Math.Max(1, _options.MaxRetries + 1);
            Exception? lastException = null;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMilliseconds(Math.Max(500, _options.OperationTimeoutMs)));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                try
                {
                    var result = await action(linkedCts.Token);
                    circuit.ConsecutiveFailures = 0;
                    circuit.OpenUntilUtc = null;
                    return result;
                }
                catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested && timeoutCts.IsCancellationRequested)
                {
                    lastException = new TimeoutException($"Operation '{operationName}' timed out.", ex);
                }
                catch (Exception ex) when (IsTransient(ex))
                {
                    lastException = ex;
                }

                if (attempt >= maxAttempts)
                {
                    break;
                }

                var delay = TimeSpan.FromMilliseconds(Math.Max(50, _options.BaseDelayMs) * attempt);
                await Task.Delay(delay, cancellationToken);
            }

            RegisterFailure(operationName, circuit);

            if (lastException is TimeoutException)
            {
                throw new BusinessRuleException(
                    "Hệ thống đang xử lý chậm, vui lòng thử lại.",
                    DefenseUcErrorCodes.Sync.Timeout,
                    new { Operation = operationName });
            }

            throw lastException ?? new BusinessRuleException(
                "Yêu cầu tạm thời thất bại, vui lòng thử lại.",
                DefenseUcErrorCodes.Common.BusinessRuleViolation,
                new { Operation = operationName });
        }

        private void EnsureCircuitClosed(string operationName, CircuitState state)
        {
            if (state.OpenUntilUtc.HasValue && state.OpenUntilUtc.Value > DateTime.UtcNow)
            {
                throw new BusinessRuleException(
                    "Hệ thống đang tạm giới hạn yêu cầu, vui lòng thử lại sau.",
                    "UCX.RESILIENCE.CIRCUIT_OPEN",
                    new { Operation = operationName, RetryAfterUtc = state.OpenUntilUtc.Value });
            }

            if (state.OpenUntilUtc.HasValue && state.OpenUntilUtc.Value <= DateTime.UtcNow)
            {
                state.OpenUntilUtc = null;
                state.ConsecutiveFailures = 0;
            }
        }

        private void RegisterFailure(string operationName, CircuitState state)
        {
            state.ConsecutiveFailures++;
            if (state.ConsecutiveFailures >= Math.Max(1, _options.CircuitFailureThreshold))
            {
                state.OpenUntilUtc = DateTime.UtcNow.AddSeconds(Math.Max(5, _options.CircuitBreakSeconds));
                throw new BusinessRuleException(
                    "Hệ thống đang tạm giới hạn yêu cầu do lỗi lặp lại, vui lòng thử lại sau.",
                    "UCX.RESILIENCE.CIRCUIT_OPEN",
                    new { Operation = operationName, RetryAfterUtc = state.OpenUntilUtc.Value });
            }
        }

        private static bool IsTransient(Exception ex)
        {
            return ex is TimeoutException
                || ex is DbUpdateException
                || ex is IOException
                || ex is HttpRequestException;
        }
    }
}
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Application.Common.Resilience;
using Xunit;

namespace ThesisManagement.Api.Tests;

public class DefenseResiliencePolicyTests
{
    [Fact]
    public async Task ExecuteAsync_ShouldRetryTransientFailure_ThenSucceed()
    {
        var options = Options.Create(new DefenseResiliencePolicyOptions
        {
            MaxRetries = 2,
            BaseDelayMs = 1,
            OperationTimeoutMs = 1000,
            CircuitFailureThreshold = 5,
            CircuitBreakSeconds = 5
        });

        var policy = new DefenseResiliencePolicy(options);
        var attempts = 0;

        var result = await policy.ExecuteAsync("TEST_TRANSIENT_RETRY", _ =>
        {
            attempts++;
            if (attempts < 3)
            {
                throw new DbUpdateException("transient", new Exception("inner"));
            }

            return Task.FromResult("OK");
        });

        result.Should().Be("OK");
        attempts.Should().Be(3);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldMapTimeoutToBusinessRuleException()
    {
        var options = Options.Create(new DefenseResiliencePolicyOptions
        {
            MaxRetries = 0,
            BaseDelayMs = 1,
            OperationTimeoutMs = 30,
            CircuitFailureThreshold = 5,
            CircuitBreakSeconds = 5
        });

        var policy = new DefenseResiliencePolicy(options);

        var act = async () => await policy.ExecuteAsync("TEST_TIMEOUT", async ct =>
        {
            await Task.Delay(1200, ct);
            return true;
        });

        var ex = await act.Should().ThrowAsync<BusinessRuleException>();
        ex.Which.Code.Should().Be(DefenseUcErrorCodes.Sync.Timeout);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldOpenCircuit_WhenFailureThresholdReached()
    {
        var options = Options.Create(new DefenseResiliencePolicyOptions
        {
            MaxRetries = 0,
            BaseDelayMs = 1,
            OperationTimeoutMs = 1000,
            CircuitFailureThreshold = 1,
            CircuitBreakSeconds = 60
        });

        var policy = new DefenseResiliencePolicy(options);

        var first = async () => await policy.ExecuteAsync("TEST_CIRCUIT", _ => Task.FromException<bool>(new DbUpdateException("db", new Exception("inner"))));
        var firstEx = await first.Should().ThrowAsync<BusinessRuleException>();
        firstEx.Which.Code.Should().Be("UCX.RESILIENCE.CIRCUIT_OPEN");

        var second = async () => await policy.ExecuteAsync("TEST_CIRCUIT", _ => Task.FromResult(true));
        var secondEx = await second.Should().ThrowAsync<BusinessRuleException>();
        secondEx.Which.Code.Should().Be("UCX.RESILIENCE.CIRCUIT_OPEN");
    }
}

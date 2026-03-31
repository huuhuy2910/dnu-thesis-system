using FluentAssertions;
using ThesisManagement.Api.Application.Common;
using ThesisManagement.Api.Models;
using Xunit;

namespace ThesisManagement.Api.Tests;

public class DefenseWorkflowStateMachineTests
{
    [Fact]
    public void EnsureCommitteeTransition_ShouldAllowForwardTransition()
    {
        var act = () => DefenseWorkflowStateMachine.EnsureCommitteeTransition(
            CommitteeStatus.Draft,
            CommitteeStatus.Ready,
            "UC2.STATE.INVALID_TRANSITION");

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureCommitteeTransition_ShouldRejectInvalidTransition()
    {
        var act = () => DefenseWorkflowStateMachine.EnsureCommitteeTransition(
            CommitteeStatus.Draft,
            CommitteeStatus.Completed,
            "UC2.STATE.INVALID_TRANSITION");

        act.Should().Throw<BusinessRuleException>()
            .Where(ex => ex.Code == "UC2.STATE.INVALID_TRANSITION");
    }

    [Theory]
    [InlineData(false, false, "Draft")]
    [InlineData(true, false, "Submitted")]
    [InlineData(true, true, "Locked")]
    [InlineData(false, true, "Locked")]
    public void ResolveScoreStatus_ShouldReturnExpected(bool submitted, bool locked, string expected)
    {
        var result = DefenseWorkflowStateMachine.ResolveScoreStatus(submitted, locked);
        result.Should().Be(expected);
    }
}

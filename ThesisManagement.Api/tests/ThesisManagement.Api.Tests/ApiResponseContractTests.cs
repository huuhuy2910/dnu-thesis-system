using FluentAssertions;
using ThesisManagement.Api.DTOs;
using Xunit;

namespace ThesisManagement.Api.Tests;

public class ApiResponseContractTests
{
    [Fact]
    public void SuccessResponse_ShouldPopulateMetadataDefaults()
    {
        var response = ApiResponse<object>.SuccessResponse(
            new { ok = true },
            code: "UC.TEST.SUCCESS",
            idempotencyReplay: true,
            allowedActions: new List<string> { "RETRY" });

        response.Success.Should().BeTrue();
        response.Code.Should().Be("UC.TEST.SUCCESS");
        response.IdempotencyReplay.Should().BeTrue();
        response.AllowedActions.Should().ContainSingle("RETRY");
        response.TraceId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Fail_ShouldKeepCodeAndHttpStatus()
    {
        var response = ApiResponse<object>.Fail(
            "validation failed",
            httpStatusCode: 409,
            code: "UC.TEST.CONFLICT");

        response.Success.Should().BeFalse();
        response.HttpStatusCode.Should().Be(409);
        response.Code.Should().Be("UC.TEST.CONFLICT");
        response.TraceId.Should().NotBeNullOrWhiteSpace();
    }
}

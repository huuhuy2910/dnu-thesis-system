using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;

namespace ThesisManagement.Api.Controllers
{
    [ApiController]
    [Route("api/v1/observability")]
    [Authorize(Roles = "Admin,Head")]
    public class ObservabilityController : ControllerBase
    {
        private readonly IApiRuntimeMetricsStore _metricsStore;

        public ObservabilityController(IApiRuntimeMetricsStore metricsStore)
        {
            _metricsStore = metricsStore;
        }

        [HttpGet("runtime-metrics")]
        public ActionResult<ApiResponse<ApiRuntimeMetricsSnapshot>> GetRuntimeMetrics()
        {
            var metrics = _metricsStore.Snapshot();
            return Ok(ApiResponse<ApiRuntimeMetricsSnapshot>.SuccessResponse(metrics));
        }
    }
}

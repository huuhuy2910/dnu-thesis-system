using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DefenseAssignmentManagementController : ControllerBase
    {
        private readonly IDefenseAssignmentService _defenseService;

        public DefenseAssignmentManagementController(IDefenseAssignmentService defenseService)
        {
            _defenseService = defenseService;
        }

        // GET: api/DefenseAssignmentManagement/available-topics
        [HttpGet("available-topics")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<AvailableTopicDto>>>> GetAvailableTopics()
        {
            var result = await _defenseService.GetAvailableTopicsAsync();
            return Ok(result);
        }

        // POST: api/DefenseAssignmentManagement/assign
        [HttpPost("assign")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> AssignTopics([FromBody] AssignDefenseDto dto)
        {
            var result = await _defenseService.AssignTopicsAsync(dto);
            return Ok(result);
        }

        // GET: api/DefenseAssignmentManagement/committee-assignments/{committeeCode}
        [HttpGet("committee-assignments/{committeeCode}")]
        public async Task<ActionResult<ApiResponse<List<DefenseAssignmentDetailDto>>>> GetCommitteeAssignments(string committeeCode)
        {
            var result = await _defenseService.GetCommitteeAssignmentsAsync(committeeCode);
            return Ok(result);
        }
    }
}

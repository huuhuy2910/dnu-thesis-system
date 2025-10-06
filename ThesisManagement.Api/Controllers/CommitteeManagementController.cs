using AutoMapper;
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
    public class CommitteeManagementController : ControllerBase
    {
        private readonly ICommitteeManagementService _committeeService;

        public CommitteeManagementController(ICommitteeManagementService committeeService)
        {
            _committeeService = committeeService;
        }

        // POST: api/CommitteeManagement/create
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<string>>> CreateCommittee([FromBody] CreateCommitteeDto dto)
        {
            var result = await _committeeService.CreateCommitteeAsync(dto);
            return Ok(result);
        }

        // POST: api/CommitteeManagement/add-members
        [HttpPost("add-members")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> AddMembers([FromBody] AddCommitteeMembersDto dto)
        {
            var result = await _committeeService.AddMembersAsync(dto);
            return Ok(result);
        }

        // GET: api/CommitteeManagement/get-detail/{code}
        [HttpGet("get-detail/{code}")]
        public async Task<ActionResult<ApiResponse<CommitteeDetailDto>>> GetCommitteeDetail(string code)
        {
            var result = await _committeeService.GetCommitteeDetailAsync(code);
            return Ok(result);
        }

        // GET: api/CommitteeManagement/available-lecturers?departmentCode=...&specialtyCode=...
        [HttpGet("available-lecturers")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<AvailableLecturerDto>>>> GetAvailableLecturers(
            [FromQuery] string? departmentCode = null,
            [FromQuery] string? specialtyCode = null)
        {
            var result = await _committeeService.GetAvailableLecturersAsync(departmentCode, specialtyCode);
            return Ok(result);
        }

        // GET: api/CommitteeManagement/lecturer-committees/{lecturerCode}
        [HttpGet("lecturer-committees/{lecturerCode}")]
        public async Task<ActionResult<ApiResponse<LecturerCommitteesDto>>> GetLecturerCommittees(string lecturerCode)
        {
            var result = await _committeeService.GetLecturerCommitteesAsync(lecturerCode);
            return Ok(result);
        }

        // GET: api/CommitteeManagement/student-defense/{studentCode}
        [HttpGet("student-defense/{studentCode}")]
        public async Task<ActionResult<ApiResponse<StudentDefenseInfoDto>>> GetStudentDefenseInfo(string studentCode)
        {
            var result = await _committeeService.GetStudentDefenseInfoAsync(studentCode);
            return Ok(result);
        }
    }
}

using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace ThesisManagement.Api.Controllers
{
    [AllowAnonymous]
    public class CommitteeAssignmentController : BaseApiController
    {
        private readonly ICommitteeAssignmentService _service;

        public CommitteeAssignmentController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            ICommitteeAssignmentService service) : base(uow, codeGen, mapper)
        {
            _service = service;
        }

        // List & Details
        /// <summary>
        /// Danh sách hội đồng (có phân trang, lọc theo từ khóa/ngày/tags)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("committees")]
        public async Task<IActionResult> GetCommitteesAsync([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? keyword = null, [FromQuery] DateTime? date = null, [FromQuery] string[]? tags = null, CancellationToken cancellationToken = default)
        {
            var response = await _service.GetCommitteesAsync(page, pageSize, keyword, date, tags, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Chi tiết hội đồng theo mã
        /// </summary>
        [AllowAnonymous]
        [HttpGet("get-detail/{committeeCode}")]
        public async Task<IActionResult> GetDetailAsync(string committeeCode, CancellationToken cancellationToken)
        {
            var response = await _service.GetCommitteeDetailAsync(committeeCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        // Create/Init/Update/Delete
        /// <summary>
        /// Dữ liệu khởi tạo tạo mới hội đồng (mã gợi ý, phòng, tags)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("get-create")]
        public async Task<IActionResult> GetCreateAsync(CancellationToken cancellationToken)
        {
            var response = await _service.GetCommitteeCreateInitAsync(cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Tạo hội đồng mới
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateAsync([FromBody] CommitteeCreateRequestDto request, CancellationToken cancellationToken)
        {
            // Role-based access: only Admin can create
            var role = GetRequestRole();
            var userCode = GetRequestUserCode();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.CreateCommitteeAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Cập nhật hội đồng
        /// </summary>
        [HttpPut("update/{committeeCode}")]
        public async Task<IActionResult> UpdateAsync(string committeeCode, [FromBody] CommitteeUpdateRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            request.CommitteeCode = committeeCode;
            var response = await _service.UpdateCommitteeAsync(committeeCode, request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Cập nhật thành viên hội đồng (vai trò, chủ tịch)
        /// </summary>
        [HttpPut("update-members/{committeeCode}")]
        public async Task<IActionResult> UpdateMembersAsync(string committeeCode, [FromBody] CommitteeMembersUpdateRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }

            request ??= new CommitteeMembersUpdateRequestDto();
            request.CommitteeCode = committeeCode;
            var response = await _service.UpdateCommitteeMembersAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Xóa hội đồng (force=true để xóa cả phân công và khôi phục trạng thái đề tài)
        /// </summary>
        [HttpDelete("delete/{committeeCode}")]
        public async Task<IActionResult> DeleteAsync(string committeeCode, [FromQuery] bool force = false, CancellationToken cancellationToken = default)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.DeleteCommitteeAsync(committeeCode, force, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        // Availability
        /// <summary>
        /// Tra cứu giảng viên khả dụng
        /// </summary>
        [AllowAnonymous]
        [HttpGet("available-lecturers")]
        public async Task<IActionResult> GetAvailableLecturersAsync([FromQuery] string? tag = null, [FromQuery] DateTime? date = null, [FromQuery] string? role = null, [FromQuery] bool? requireChair = null, [FromQuery] string? committeeCode = null, CancellationToken cancellationToken = default)
        {
            var response = await _service.GetAvailableLecturersAsync(tag, date, role, requireChair, committeeCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Tra cứu đề tài đủ điều kiện để phân hội đồng
        /// </summary>
        [AllowAnonymous]
        [HttpGet("available-topics")]
        public async Task<IActionResult> GetAvailableTopicsAsync([FromQuery] string? tag = null, [FromQuery] string? department = null, [FromQuery] string? committeeCode = null, CancellationToken cancellationToken = default)
        {
            var response = await _service.GetAvailableTopicsAsync(tag, department, committeeCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Danh sách tag chuyên ngành (cho form tạo hội đồng)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("tags")]
        public async Task<IActionResult> GetTagsAsync(CancellationToken cancellationToken = default)
        {
            var response = await _service.GetTagsAsync(cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        // Assignments
        /// <summary>
        /// Phân công đề tài cho hội đồng theo phiên và ngày cụ thể
        /// </summary>
        [HttpPost("assign")]
        public async Task<IActionResult> AssignAsync([FromBody] AssignTopicRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.AssignTopicsAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Lưu danh sách giảng viên cho hội đồng theo vai trò
        /// </summary>
        [HttpPost("members")]
        public async Task<IActionResult> SaveMembersAsync([FromBody] CommitteeMembersCreateRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }

            var response = await _service.SaveCommitteeMembersAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Tự động phân công tất cả đề tài đủ điều kiện theo ưu tiên tag và giới hạn mỗi buổi
        /// </summary>
        [HttpPost("auto-assign")]
        public async Task<IActionResult> AutoAssignAsync([FromBody] AutoAssignRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.AutoAssignTopicsAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Thay đổi lịch bảo vệ của 1 đề tài trong hội đồng
        /// </summary>
        [HttpPut("change-assignment")]
        public async Task<IActionResult> ChangeAssignmentAsync([FromBody] ChangeAssignmentRequestDto request, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.ChangeAssignmentAsync(request, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Gỡ phân công đề tài khỏi hội đồng (trả trạng thái đề tài về đủ điều kiện)
        /// </summary>
        [HttpDelete("remove-assignment/{topicCode}")]
        public async Task<IActionResult> RemoveAssignmentAsync(string topicCode, CancellationToken cancellationToken)
        {
            var role = GetRequestRole();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Không có quyền thực hiện thao tác này.", StatusCodes.Status403Forbidden));
            }
            var response = await _service.RemoveAssignmentAsync(topicCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        // Views
        /// <summary>
        /// Danh sách hội đồng mà giảng viên tham gia
        /// </summary>
        [AllowAnonymous]
        [HttpGet("lecturer-committees/{lecturerCode}")]
        public async Task<IActionResult> GetLecturerCommitteesAsync(string lecturerCode, CancellationToken cancellationToken = default)
        {
            var response = await _service.GetLecturerCommitteesAsync(lecturerCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        /// <summary>
        /// Thông tin lịch bảo vệ của sinh viên
        /// </summary>
        [AllowAnonymous]
        [HttpGet("student-defense/{studentCode}")]
        public async Task<IActionResult> GetStudentDefenseInfoAsync(string studentCode, CancellationToken cancellationToken = default)
        {
            var response = await _service.GetStudentDefenseInfoAsync(studentCode, cancellationToken);
            return StatusCode(GetStatusCode(response), response);
        }

        private static int GetStatusCode<T>(ApiResponse<T> response)
        {
            if (response.HttpStatusCode == 0)
            {
                return response.Success ? StatusCodes.Status200OK : StatusCodes.Status400BadRequest;
            }
            return response.HttpStatusCode;
        }
    }
}

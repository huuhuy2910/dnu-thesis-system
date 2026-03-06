using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ThesisManagement.Api.Application.Query.SystemActivityLogs;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.SystemActivityLogs.Query;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    /// <summary>
    /// API quản lý logs hoạt động hệ thống - Chỉ đọc (Read-only)
    /// </summary>
    public class SystemActivityLogsController : BaseApiController
    {
        private readonly IGetSystemActivityLogsListQuery _getSystemActivityLogsListQuery;
        private readonly IGetSystemActivityLogDetailQuery _getSystemActivityLogDetailQuery;
        private readonly IGetSystemActivityLogsByEntityQuery _getSystemActivityLogsByEntityQuery;
        private readonly IGetSystemActivityLogsByUserQuery _getSystemActivityLogsByUserQuery;
        private readonly IGetSystemActivityLogsByModuleQuery _getSystemActivityLogsByModuleQuery;
        private readonly IGetSystemActivityLogStatsQuery _getSystemActivityLogStatsQuery;

        public SystemActivityLogsController(
            IUnitOfWork uow,
            ICodeGenerator codeGen,
            IMapper mapper,
            IGetSystemActivityLogsListQuery getSystemActivityLogsListQuery,
            IGetSystemActivityLogDetailQuery getSystemActivityLogDetailQuery,
            IGetSystemActivityLogsByEntityQuery getSystemActivityLogsByEntityQuery,
            IGetSystemActivityLogsByUserQuery getSystemActivityLogsByUserQuery,
            IGetSystemActivityLogsByModuleQuery getSystemActivityLogsByModuleQuery,
            IGetSystemActivityLogStatsQuery getSystemActivityLogStatsQuery)
            : base(uow, codeGen, mapper)
        {
            _getSystemActivityLogsListQuery = getSystemActivityLogsListQuery;
            _getSystemActivityLogDetailQuery = getSystemActivityLogDetailQuery;
            _getSystemActivityLogsByEntityQuery = getSystemActivityLogsByEntityQuery;
            _getSystemActivityLogsByUserQuery = getSystemActivityLogsByUserQuery;
            _getSystemActivityLogsByModuleQuery = getSystemActivityLogsByModuleQuery;
            _getSystemActivityLogStatsQuery = getSystemActivityLogStatsQuery;
        }

        /// <summary>
        /// Lấy danh sách activity logs với filter và phân trang
        /// </summary>
        /// <param name="filter">Bộ lọc: EntityName, ActionType, UserCode, Module, Status, PerformedFrom/To...</param>
        /// <returns>Danh sách logs</returns>
        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] SystemActivityLogFilter filter)
        {
            var result = await _getSystemActivityLogsListQuery.ExecuteAsync(filter);
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        /// <summary>
        /// Lấy chi tiết một activity log theo ID
        /// </summary>
        /// <param name="id">LogID</param>
        /// <returns>Chi tiết log</returns>
        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var dto = await _getSystemActivityLogDetailQuery.ExecuteAsync(id);
            if (dto == null)
                return NotFound(ApiResponse<object>.Fail("Activity log not found", 404));

            return Ok(ApiResponse<SystemActivityLogReadDto>.SuccessResponse(dto));
        }

        /// <summary>
        /// Lấy logs của một entity cụ thể
        /// </summary>
        /// <param name="entityName">Tên entity (VD: "Topic", "StudentProfile")</param>
        /// <param name="entityId">ID hoặc Code của entity</param>
        /// <param name="filter">Bộ lọc bổ sung</param>
        /// <returns>Danh sách logs của entity</returns>
        [HttpGet("by-entity")]
        public async Task<IActionResult> GetByEntity(
            [FromQuery] string entityName, 
            [FromQuery] string entityId,
            [FromQuery] SystemActivityLogFilter filter)
        {
            var result = await _getSystemActivityLogsByEntityQuery.ExecuteAsync(entityName, entityId, filter);
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        /// <summary>
        /// Lấy logs của một user cụ thể
        /// </summary>
        /// <param name="userCode">Mã người dùng</param>
        /// <param name="filter">Bộ lọc bổ sung</param>
        /// <returns>Danh sách logs của user</returns>
        [HttpGet("by-user/{userCode}")]
        public async Task<IActionResult> GetByUser(
            string userCode,
            [FromQuery] SystemActivityLogFilter filter)
        {
            var result = await _getSystemActivityLogsByUserQuery.ExecuteAsync(userCode, filter);
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        /// <summary>
        /// Lấy logs theo module/phân hệ
        /// </summary>
        /// <param name="module">Module: Topic, Milestone, Defense, Committee...</param>
        /// <param name="filter">Bộ lọc bổ sung</param>
        /// <returns>Danh sách logs theo module</returns>
        [HttpGet("by-module/{module}")]
        public async Task<IActionResult> GetByModule(
            string module,
            [FromQuery] SystemActivityLogFilter filter)
        {
            var result = await _getSystemActivityLogsByModuleQuery.ExecuteAsync(module, filter);
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(result.Items, result.TotalCount));
        }

        /// <summary>
        /// Thống kê số lượng logs theo ActionType
        /// </summary>
        /// <param name="from">Từ ngày (optional)</param>
        /// <param name="to">Đến ngày (optional)</param>
        /// <returns>Thống kê số lượng theo từng loại action</returns>
        [HttpGet("stats/by-action-type")]
        public async Task<IActionResult> GetStatsByActionType(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var stats = await _getSystemActivityLogStatsQuery.GetByActionTypeAsync(from, to);
            return Ok(ApiResponse<object>.SuccessResponse(stats, stats.Count));
        }

        /// <summary>
        /// Thống kê số lượng logs theo Module
        /// </summary>
        /// <param name="from">Từ ngày (optional)</param>
        /// <param name="to">Đến ngày (optional)</param>
        /// <returns>Thống kê số lượng theo từng module</returns>
        [HttpGet("stats/by-module")]
        public async Task<IActionResult> GetStatsByModule(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var stats = await _getSystemActivityLogStatsQuery.GetByModuleAsync(from, to);
            return Ok(ApiResponse<object>.SuccessResponse(stats, stats.Count));
        }
    }
}

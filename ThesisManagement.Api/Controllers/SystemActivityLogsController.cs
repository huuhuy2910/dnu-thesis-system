using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Controllers
{
    /// <summary>
    /// API quản lý logs hoạt động hệ thống - Chỉ đọc (Read-only)
    /// </summary>
    public class SystemActivityLogsController : BaseApiController
    {
        public SystemActivityLogsController(IUnitOfWork uow, ICodeGenerator codeGen, IMapper mapper) 
            : base(uow, codeGen, mapper) { }

        /// <summary>
        /// Lấy danh sách activity logs với filter và phân trang
        /// </summary>
        /// <param name="filter">Bộ lọc: EntityName, ActionType, UserCode, Module, Status, PerformedFrom/To...</param>
        /// <returns>Danh sách logs</returns>
        [HttpGet("get-list")]
        public async Task<IActionResult> GetList([FromQuery] SystemActivityLogFilter filter)
        {
            var result = await _uow.SystemActivityLogs.GetPagedWithFilterAsync(
                filter.Page, 
                filter.PageSize, 
                filter,
                (query, f) => query.ApplyFilter(f));
            
            var dtos = result.Items.Select(x => _mapper.Map<SystemActivityLogReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(dtos, result.TotalCount));
        }

        /// <summary>
        /// Lấy chi tiết một activity log theo ID
        /// </summary>
        /// <param name="id">LogID</param>
        /// <returns>Chi tiết log</returns>
        [HttpGet("get-detail/{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var ent = await _uow.SystemActivityLogs.GetByIdAsync(id);
            if (ent == null) 
                return NotFound(ApiResponse<object>.Fail("Activity log not found", 404));
            
            return Ok(ApiResponse<SystemActivityLogReadDto>.SuccessResponse(_mapper.Map<SystemActivityLogReadDto>(ent)));
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
            filter.EntityName = entityName;
            filter.EntityID = entityId;

            var result = await _uow.SystemActivityLogs.GetPagedWithFilterAsync(
                filter.Page,
                filter.PageSize,
                filter,
                (query, f) => query.ApplyFilter(f));

            var dtos = result.Items.Select(x => _mapper.Map<SystemActivityLogReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(dtos, result.TotalCount));
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
            filter.UserCode = userCode;

            var result = await _uow.SystemActivityLogs.GetPagedWithFilterAsync(
                filter.Page,
                filter.PageSize,
                filter,
                (query, f) => query.ApplyFilter(f));

            var dtos = result.Items.Select(x => _mapper.Map<SystemActivityLogReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(dtos, result.TotalCount));
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
            filter.Module = module;

            var result = await _uow.SystemActivityLogs.GetPagedWithFilterAsync(
                filter.Page,
                filter.PageSize,
                filter,
                (query, f) => query.ApplyFilter(f));

            var dtos = result.Items.Select(x => _mapper.Map<SystemActivityLogReadDto>(x));
            return Ok(ApiResponse<IEnumerable<SystemActivityLogReadDto>>.SuccessResponse(dtos, result.TotalCount));
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
            var query = _uow.SystemActivityLogs.Query();

            if (from.HasValue)
                query = query.Where(x => x.PerformedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(x => x.PerformedAt <= to.Value);

            var stats = await query
                .GroupBy(x => x.ActionType)
                .Select(g => new 
                { 
                    ActionType = g.Key, 
                    Count = g.Count() 
                })
                .ToListAsync();

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
            var query = _uow.SystemActivityLogs.Query();

            if (from.HasValue)
                query = query.Where(x => x.PerformedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(x => x.PerformedAt <= to.Value);

            var stats = await query
                .GroupBy(x => x.Module)
                .Select(g => new 
                { 
                    Module = g.Key, 
                    Count = g.Count() 
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResponse(stats, stats.Count));
        }
    }
}

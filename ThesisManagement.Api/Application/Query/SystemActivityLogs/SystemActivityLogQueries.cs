using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.DTOs;
using ThesisManagement.Api.DTOs.SystemActivityLogs.Query;
using ThesisManagement.Api.Helpers;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.SystemActivityLogs
{
    public interface IGetSystemActivityLogsListQuery
    {
        Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(SystemActivityLogFilter filter);
    }

    public interface IGetSystemActivityLogDetailQuery
    {
        Task<SystemActivityLogReadDto?> ExecuteAsync(int id);
    }

    public interface IGetSystemActivityLogsByEntityQuery
    {
        Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string entityName, string entityId, SystemActivityLogFilter filter);
    }

    public interface IGetSystemActivityLogsByUserQuery
    {
        Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string userCode, SystemActivityLogFilter filter);
    }

    public interface IGetSystemActivityLogsByModuleQuery
    {
        Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string module, SystemActivityLogFilter filter);
    }

    public interface IGetSystemActivityLogStatsQuery
    {
        Task<List<object>> GetByActionTypeAsync(DateTime? from, DateTime? to);
        Task<List<object>> GetByModuleAsync(DateTime? from, DateTime? to);
    }

    public class GetSystemActivityLogsListQuery : IGetSystemActivityLogsListQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetSystemActivityLogsListQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(SystemActivityLogFilter filter)
        {
            var result = await _uow.SystemActivityLogs.GetPagedWithFilterAsync(filter.Page, filter.PageSize, filter, (query, f) => query.ApplyFilter(f));
            return (result.Items.Select(x => _mapper.Map<SystemActivityLogReadDto>(x)), result.TotalCount);
        }
    }

    public class GetSystemActivityLogDetailQuery : IGetSystemActivityLogDetailQuery
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        public GetSystemActivityLogDetailQuery(IUnitOfWork uow, IMapper mapper) { _uow = uow; _mapper = mapper; }
        public async Task<SystemActivityLogReadDto?> ExecuteAsync(int id)
        {
            var ent = await _uow.SystemActivityLogs.GetByIdAsync(id);
            return ent == null ? null : _mapper.Map<SystemActivityLogReadDto>(ent);
        }
    }

    public class GetSystemActivityLogsByEntityQuery : IGetSystemActivityLogsByEntityQuery
    {
        private readonly IGetSystemActivityLogsListQuery _list;
        public GetSystemActivityLogsByEntityQuery(IGetSystemActivityLogsListQuery list) { _list = list; }
        public Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string entityName, string entityId, SystemActivityLogFilter filter)
        {
            filter.EntityName = entityName; filter.EntityID = entityId; return _list.ExecuteAsync(filter);
        }
    }

    public class GetSystemActivityLogsByUserQuery : IGetSystemActivityLogsByUserQuery
    {
        private readonly IGetSystemActivityLogsListQuery _list;
        public GetSystemActivityLogsByUserQuery(IGetSystemActivityLogsListQuery list) { _list = list; }
        public Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string userCode, SystemActivityLogFilter filter)
        {
            filter.UserCode = userCode; return _list.ExecuteAsync(filter);
        }
    }

    public class GetSystemActivityLogsByModuleQuery : IGetSystemActivityLogsByModuleQuery
    {
        private readonly IGetSystemActivityLogsListQuery _list;
        public GetSystemActivityLogsByModuleQuery(IGetSystemActivityLogsListQuery list) { _list = list; }
        public Task<(IEnumerable<SystemActivityLogReadDto> Items, int TotalCount)> ExecuteAsync(string module, SystemActivityLogFilter filter)
        {
            filter.Module = module; return _list.ExecuteAsync(filter);
        }
    }

    public class GetSystemActivityLogStatsQuery : IGetSystemActivityLogStatsQuery
    {
        private readonly IUnitOfWork _uow;
        public GetSystemActivityLogStatsQuery(IUnitOfWork uow) { _uow = uow; }

        public async Task<List<object>> GetByActionTypeAsync(DateTime? from, DateTime? to)
        {
            var query = _uow.SystemActivityLogs.Query();
            if (from.HasValue) query = query.Where(x => x.PerformedAt >= from.Value);
            if (to.HasValue) query = query.Where(x => x.PerformedAt <= to.Value);
            return await query.GroupBy(x => x.ActionType).Select(g => new { ActionType = g.Key, Count = g.Count() }).Cast<object>().ToListAsync();
        }

        public async Task<List<object>> GetByModuleAsync(DateTime? from, DateTime? to)
        {
            var query = _uow.SystemActivityLogs.Query();
            if (from.HasValue) query = query.Where(x => x.PerformedAt >= from.Value);
            if (to.HasValue) query = query.Where(x => x.PerformedAt <= to.Value);
            return await query.GroupBy(x => x.Module).Select(g => new { Module = g.Key, Count = g.Count() }).Cast<object>().ToListAsync();
        }
    }
}

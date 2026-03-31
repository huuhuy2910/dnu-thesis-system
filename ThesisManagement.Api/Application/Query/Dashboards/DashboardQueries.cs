using System.Data;
using Microsoft.EntityFrameworkCore;
using ThesisManagement.Api.Data;
using ThesisManagement.Api.Services;

namespace ThesisManagement.Api.Application.Query.Dashboards
{
    public interface IDashboardQueryProcessor
    {
        Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerOverviewAsync(string? lecturerCode);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerReviewQueueAsync(string? lecturerCode, int limit);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerScoringProgressAsync(string? lecturerCode, int limit);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerDeadlineRiskAsync(string? lecturerCode, int limit);

        Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceOverviewAsync();
        Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceAtRiskAsync(int limit);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceBacklogAsync();
        Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceDepartmentBreakdownAsync();

        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminOverviewAsync();
        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminPeriodFunnelAsync(int limit);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminCouncilCapacityAsync(int limit);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminScoreQualityAsync();
        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminSlaBottleneckAsync(int days);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminSecurityAuditAsync(int days, int limit);

        Task<IReadOnlyList<Dictionary<string, object?>>> GetDailyKpiByRoleAsync(string? roleName, int days);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetPeriodSnapshotAsync(int days);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetSlaBreachDailyAsync(int days);
        Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerWorkloadDailyAsync(string? lecturerCode, int days);
    }

    public class DashboardQueryProcessor : IDashboardQueryProcessor
    {
        private readonly ApplicationDbContext _db;
        private readonly ICurrentUserService _currentUserService;

        public DashboardQueryProcessor(ApplicationDbContext db, ICurrentUserService currentUserService)
        {
            _db = db;
            _currentUserService = currentUserService;
        }

        public async Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerOverviewAsync(string? lecturerCode)
        {
            var effectiveLecturerCode = await ResolveLecturerCodeAsync(lecturerCode);
            var sql = "SELECT * FROM VW_DASH_LECTURER_OVERVIEW";
            var parameters = new List<(string Name, object? Value)>();

            if (!string.IsNullOrWhiteSpace(effectiveLecturerCode))
            {
                sql += " WHERE LECTURERCODE = :P_LECTURER_CODE";
                parameters.Add(("P_LECTURER_CODE", effectiveLecturerCode));
            }

            sql += " ORDER BY LECTURERCODE";
            return await QueryRowsAsync(sql, parameters);
        }

        public async Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerReviewQueueAsync(string? lecturerCode, int limit)
        {
            var effectiveLecturerCode = await ResolveLecturerCodeAsync(lecturerCode);
            var innerSql = "SELECT * FROM VW_DASH_LECTURER_REVIEW_QUEUE";
            var parameters = new List<(string Name, object? Value)>();

            if (!string.IsNullOrWhiteSpace(effectiveLecturerCode))
            {
                innerSql += " WHERE LECTURERCODE = :P_LECTURER_CODE";
                parameters.Add(("P_LECTURER_CODE", effectiveLecturerCode));
            }

            innerSql += " ORDER BY HOURS_WAITING_REVIEW DESC, SUBMITTEDAT ASC";
            parameters.Add(("P_LIMIT", ClampLimit(limit, 100)));

            var sql = $"SELECT * FROM ({innerSql}) WHERE ROWNUM <= :P_LIMIT";
            return await QueryRowsAsync(sql, parameters);
        }

        public async Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerScoringProgressAsync(string? lecturerCode, int limit)
        {
            var effectiveLecturerCode = await ResolveLecturerCodeAsync(lecturerCode);
            var innerSql = "SELECT * FROM VW_DASH_LECTURER_SCORING_PROGRESS";
            var parameters = new List<(string Name, object? Value)>();

            if (!string.IsNullOrWhiteSpace(effectiveLecturerCode))
            {
                innerSql += " WHERE LECTURERCODE = :P_LECTURER_CODE";
                parameters.Add(("P_LECTURER_CODE", effectiveLecturerCode));
            }

            innerSql += " ORDER BY PENDING_COUNT DESC, OVERDUE_COUNT DESC";
            parameters.Add(("P_LIMIT", ClampLimit(limit, 100)));

            var sql = $"SELECT * FROM ({innerSql}) WHERE ROWNUM <= :P_LIMIT";
            return await QueryRowsAsync(sql, parameters);
        }

        public async Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerDeadlineRiskAsync(string? lecturerCode, int limit)
        {
            var effectiveLecturerCode = await ResolveLecturerCodeAsync(lecturerCode);
            var innerSql = "SELECT * FROM VW_DASH_LECTURER_DEADLINE_RISK";
            var parameters = new List<(string Name, object? Value)>();

            if (!string.IsNullOrWhiteSpace(effectiveLecturerCode))
            {
                innerSql += " WHERE LECTURERCODE = :P_LECTURER_CODE";
                parameters.Add(("P_LECTURER_CODE", effectiveLecturerCode));
            }

            innerSql += " ORDER BY CASE RISK_LEVEL WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, HOURS_OVERDUE DESC";
            parameters.Add(("P_LIMIT", ClampLimit(limit, 100)));

            var sql = $"SELECT * FROM ({innerSql}) WHERE ROWNUM <= :P_LIMIT";
            return await QueryRowsAsync(sql, parameters);
        }

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceOverviewAsync()
            => QueryRowsAsync("SELECT * FROM VW_DASH_STUDENT_SERVICE_OVERVIEW", Array.Empty<(string Name, object? Value)>());

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceAtRiskAsync(int limit)
            => QueryRowsAsync(
                "SELECT * FROM (SELECT * FROM VW_DASH_STUDENT_SERVICE_AT_RISK ORDER BY RISK_SCORE DESC, OVERDUE_REVIEW_COUNT DESC) WHERE ROWNUM <= :P_LIMIT",
                new[] { ("P_LIMIT", (object?)ClampLimit(limit, 200)) });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceBacklogAsync()
            => QueryRowsAsync("SELECT * FROM VW_DASH_STUDENT_SERVICE_BACKLOG ORDER BY MODULE_NAME", Array.Empty<(string Name, object? Value)>());

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetStudentServiceDepartmentBreakdownAsync()
            => QueryRowsAsync(
                "SELECT * FROM VW_DASH_STUDENT_SERVICE_DEPARTMENT_BREAKDOWN ORDER BY DEPARTMENTCODE",
                Array.Empty<(string Name, object? Value)>());

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminOverviewAsync()
            => QueryRowsAsync("SELECT * FROM VW_DASH_ADMIN_OVERVIEW", Array.Empty<(string Name, object? Value)>());

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminPeriodFunnelAsync(int limit)
            => QueryRowsAsync(
                "SELECT * FROM (SELECT * FROM VW_DASH_ADMIN_PERIOD_FUNNEL ORDER BY STARTDATE DESC NULLS LAST, DEFENSETERMID DESC) WHERE ROWNUM <= :P_LIMIT",
                new[] { ("P_LIMIT", (object?)ClampLimit(limit, 200)) });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminCouncilCapacityAsync(int limit)
            => QueryRowsAsync(
                "SELECT * FROM (SELECT * FROM VW_DASH_ADMIN_COUNCIL_CAPACITY ORDER BY LOAD_RATIO DESC NULLS LAST, ASSIGNMENT_COUNT DESC) WHERE ROWNUM <= :P_LIMIT",
                new[] { ("P_LIMIT", (object?)ClampLimit(limit, 200)) });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminScoreQualityAsync()
            => QueryRowsAsync("SELECT * FROM VW_DASH_ADMIN_SCORE_QUALITY", Array.Empty<(string Name, object? Value)>());

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminSlaBottleneckAsync(int days)
            => QueryRowsAsync(
                "SELECT * FROM VW_DASH_ADMIN_SLA_BOTTLENECK WHERE METRIC_DATE >= (TRUNC(SYSDATE) - :P_DAYS) ORDER BY METRIC_DATE DESC, MODULE_NAME",
                new[] { ("P_DAYS", (object?)ClampDays(days)) });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetAdminSecurityAuditAsync(int days, int limit)
            => QueryRowsAsync(
                "SELECT * FROM (SELECT * FROM VW_DASH_ADMIN_SECURITY_AUDIT WHERE METRIC_DATE >= (TRUNC(SYSDATE) - :P_DAYS) ORDER BY METRIC_DATE DESC, FAILED_COUNT DESC) WHERE ROWNUM <= :P_LIMIT",
                new[]
                {
                    ("P_DAYS", (object?)ClampDays(days)),
                    ("P_LIMIT", (object?)ClampLimit(limit, 200))
                });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetDailyKpiByRoleAsync(string? roleName, int days)
        {
            var sql = "SELECT * FROM MV_DASH_DAILY_KPI_BY_ROLE WHERE SNAP_DATE >= (TRUNC(SYSDATE) - :P_DAYS)";
            var parameters = new List<(string Name, object? Value)> { ("P_DAYS", ClampDays(days)) };

            if (!string.IsNullOrWhiteSpace(roleName))
            {
                sql += " AND ROLE_NAME = :P_ROLE_NAME";
                parameters.Add(("P_ROLE_NAME", roleName.Trim().ToUpperInvariant()));
            }

            sql += " ORDER BY SNAP_DATE DESC, ROLE_NAME, KPI_NAME";
            return QueryRowsAsync(sql, parameters);
        }

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetPeriodSnapshotAsync(int days)
            => QueryRowsAsync(
                "SELECT * FROM MV_DASH_PERIOD_SNAPSHOT WHERE SNAP_DATE >= (TRUNC(SYSDATE) - :P_DAYS) ORDER BY SNAP_DATE DESC, DEFENSETERMID DESC",
                new[] { ("P_DAYS", (object?)ClampDays(days)) });

        public Task<IReadOnlyList<Dictionary<string, object?>>> GetSlaBreachDailyAsync(int days)
            => QueryRowsAsync(
                "SELECT * FROM MV_DASH_SLA_BREACH_DAILY WHERE METRIC_DATE >= (TRUNC(SYSDATE) - :P_DAYS) ORDER BY METRIC_DATE DESC, MODULE_NAME",
                new[] { ("P_DAYS", (object?)ClampDays(days)) });

        public async Task<IReadOnlyList<Dictionary<string, object?>>> GetLecturerWorkloadDailyAsync(string? lecturerCode, int days)
        {
            var effectiveLecturerCode = await ResolveLecturerCodeAsync(lecturerCode);
            var sql = "SELECT * FROM MV_DASH_LECTURER_WORKLOAD_DAILY WHERE SNAP_DATE >= (TRUNC(SYSDATE) - :P_DAYS)";
            var parameters = new List<(string Name, object? Value)> { ("P_DAYS", ClampDays(days)) };

            if (!string.IsNullOrWhiteSpace(effectiveLecturerCode))
            {
                sql += " AND LECTURERCODE = :P_LECTURER_CODE";
                parameters.Add(("P_LECTURER_CODE", effectiveLecturerCode));
            }

            sql += " ORDER BY SNAP_DATE DESC, LECTURERCODE";
            return await QueryRowsAsync(sql, parameters);
        }

        private async Task<string?> ResolveLecturerCodeAsync(string? lecturerCode)
        {
            if (!string.IsNullOrWhiteSpace(lecturerCode))
            {
                return lecturerCode.Trim();
            }

            var userCode = _currentUserService.GetUserCode();
            if (string.IsNullOrWhiteSpace(userCode))
            {
                return null;
            }

            var profile = await _db.LecturerProfiles
                .Where(x => x.UserCode == userCode || x.LecturerCode == userCode)
                .Select(x => x.LecturerCode)
                .FirstOrDefaultAsync();

            return string.IsNullOrWhiteSpace(profile) ? null : profile;
        }

        private async Task<IReadOnlyList<Dictionary<string, object?>>> QueryRowsAsync(
            string sql,
            IEnumerable<(string Name, object? Value)> parameters)
        {
            var rows = new List<Dictionary<string, object?>>();
            var conn = _db.Database.GetDbConnection();
            var shouldClose = conn.State != ConnectionState.Open;

            if (shouldClose)
            {
                await conn.OpenAsync();
            }

            try
            {
                await using var cmd = conn.CreateCommand();
                cmd.CommandText = sql;

                foreach (var (name, value) in parameters)
                {
                    var p = cmd.CreateParameter();
                    p.ParameterName = name;
                    p.Value = value ?? DBNull.Value;
                    cmd.Parameters.Add(p);
                }

                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                    for (var i = 0; i < reader.FieldCount; i++)
                    {
                        object? value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                        if (value != null && value.GetType().Namespace?.StartsWith("Oracle.ManagedDataAccess.Types", StringComparison.Ordinal) == true)
                        {
                            value = value.ToString();
                        }

                        row[reader.GetName(i)] = value;
                    }

                    rows.Add(row);
                }
            }
            finally
            {
                if (shouldClose)
                {
                    await conn.CloseAsync();
                }
            }

            return rows;
        }

        private static int ClampLimit(int value, int fallback, int max = 1000)
        {
            if (value <= 0)
            {
                return fallback;
            }

            return Math.Min(value, max);
        }

        private static int ClampDays(int value)
        {
            if (value <= 0)
            {
                return 30;
            }

            return Math.Min(value, 3650);
        }
    }
}

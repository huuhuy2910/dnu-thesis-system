import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardList,
  Layers3,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getStudentServiceAtRisk,
  getStudentServiceBacklog,
  getStudentServiceDepartmentBreakdown,
  getStudentServiceOverview,
  normalizeDashboardItems,
  normalizeDashboardResponse,
  readDashboardNumber,
  readDashboardString,
  type DashboardRecord,
} from "../../services/dashboard.service";
import "./StudentServiceDashboard.css";

type DashboardStat = {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  accent: "orange" | "blue" | "green" | "purple";
};

type IssueRow = {
  title: string;
  subtitle: string;
  status: string;
  date: string;
};

type DepartmentRow = {
  label: string;
  value: number;
};

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function formatDate(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return "--";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }
  return parsed.toLocaleDateString("vi-VN");
}

function formatStatus(value: unknown): string {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "Chưa xác định";
  if (text.includes("overdue") || text.includes("late") || text.includes("quá")) {
    return "Quá hạn";
  }
  if (text.includes("pending") || text.includes("chờ") || text.includes("review")) {
    return "Chờ xử lý";
  }
  if (text.includes("done") || text.includes("complete") || text.includes("approved")) {
    return "Hoàn thành";
  }
  return value ? String(value) : "Chưa xác định";
}

function statusTone(value: string): "danger" | "warning" | "success" | "neutral" {
  const normalized = value.toLowerCase();
  if (normalized.includes("quá") || normalized.includes("late") || normalized.includes("overdue")) {
    return "danger";
  }
  if (normalized.includes("chờ") || normalized.includes("pending") || normalized.includes("review")) {
    return "warning";
  }
  if (normalized.includes("hoàn") || normalized.includes("done") || normalized.includes("approved")) {
    return "success";
  }
  return "neutral";
}

function resolveIssueTitle(row: DashboardRecord): string {
  return (
    readDashboardString(row, ["title", "topicTitle", "topicName", "moduleName"], "") ||
    readDashboardString(row, ["departmentName", "studentFullName", "name"], "") ||
    "Mục cần xử lý"
  );
}

function resolveIssueSubtitle(row: DashboardRecord): string {
  const first = readDashboardString(
    row,
    ["studentFullName", "studentCode", "topicCode", "departmentName"],
    "",
  );
  const second = readDashboardString(
    row,
    ["lecturerName", "lecturerCode", "ownerName", "description"],
    "",
  );
  if (first && second) {
    return `${first} • ${second}`;
  }
  return first || second || "--";
}

function resolveIssueStatus(row: DashboardRecord): string {
  return formatStatus(readDashboardString(row, ["status", "state", "priority", "riskLevel"], ""));
}

function resolveIssueDate(row: DashboardRecord): string {
  return formatDate(
    readDashboardString(row, ["deadline", "createdAt", "lastUpdated", "updatedAt", "date"], ""),
  );
}

function resolveDepartmentLabel(row: DashboardRecord): string {
  return (
    readDashboardString(row, ["departmentName", "name", "departmentCode", "facultyName"], "") ||
    "Khoa / bộ môn"
  );
}

function resolveDepartmentValue(row: DashboardRecord): number {
  return readDashboardNumber(
    row,
    [
      "totalCount",
      "count",
      "topicCount",
      "itemsCount",
      "studentCount",
      "assignedCount",
      "pendingCount",
      "atRiskCount",
    ],
    0,
  );
}

function buildIssues(rows: DashboardRecord[]): IssueRow[] {
  return rows.slice(0, 6).map((row) => ({
    title: resolveIssueTitle(row),
    subtitle: resolveIssueSubtitle(row),
    status: resolveIssueStatus(row),
    date: resolveIssueDate(row),
  }));
}

function buildDepartments(rows: DashboardRecord[]): DepartmentRow[] {
  return rows.slice(0, 8).map((row) => ({
    label: resolveDepartmentLabel(row),
    value: resolveDepartmentValue(row),
  }));
}

const StudentServiceDashboard: React.FC = () => {
  const [overviewRows, setOverviewRows] = useState<DashboardRecord[]>([]);
  const [riskRows, setRiskRows] = useState<DashboardRecord[]>([]);
  const [backlogRows, setBacklogRows] = useState<DashboardRecord[]>([]);
  const [departmentRows, setDepartmentRows] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [overviewResponse, riskResponse, backlogResponse, departmentResponse] = await Promise.all([
          getStudentServiceOverview({ limit: 1 }),
          getStudentServiceAtRisk({ days: 30, limit: 8 }),
          getStudentServiceBacklog({ days: 30, limit: 8 }),
          getStudentServiceDepartmentBreakdown({ limit: 8 }),
        ]);

        if (cancelled) {
          return;
        }

        setOverviewRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(overviewResponse),
          ),
        );
        setRiskRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(riskResponse),
          ),
        );
        setBacklogRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(backlogResponse),
          ),
        );
        setDepartmentRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(departmentResponse),
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu dashboard student-service.",
          );
          setOverviewRows([]);
          setRiskRows([]);
          setBacklogRows([]);
          setDepartmentRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const overviewRow = useMemo(() => overviewRows[0] ?? {}, [overviewRows]);
  const maxDepartmentValue = Math.max(1, ...departmentRows.map((row) => resolveDepartmentValue(row)));

  const stats = useMemo<DashboardStat[]>(() => {
    const riskCount = readDashboardNumber(overviewRow, ["AT_RISK_TOPICS", "atRiskTopics", "riskCount"], riskRows.length);
    const backlogCount = readDashboardNumber(overviewRow, ["BACKLOG_COUNT", "backlogCount", "pendingCount"], backlogRows.length);
    const pendingApprovals = readDashboardNumber(
      overviewRow,
      ["PENDING_APPROVALS", "pendingApprovals", "topicsPending"],
      0,
    );
    const totalTopics = readDashboardNumber(
      overviewRow,
      ["TOTAL_TOPICS", "totalTopics", "topicCount", "totalCount"],
      0,
    );
    const departmentsCount = readDashboardNumber(
      overviewRow,
      ["DEPARTMENT_COUNT", "departmentCount", "departmentsCount"],
      departmentRows.length,
    );

    return [
      {
        label: "TỔNG ĐỀ TÀI",
        value: totalTopics,
        hint: "Toàn bộ đề tài đang theo dõi",
        icon: <BookOpen size={24} />,
        accent: "orange",
      },
      {
        label: "CHỜ XỬ LÝ",
        value: pendingApprovals,
        hint: "Các yêu cầu cần xác nhận",
        icon: <ClipboardList size={24} />,
        accent: "blue",
      },
      {
        label: "NGUY CƠ CAO",
        value: riskCount,
        hint: "Mục cần ưu tiên can thiệp",
        icon: <ShieldAlert size={24} />,
        accent: "green",
      },
      {
        label: "TỒN ĐỌNG",
        value: backlogCount,
        hint: `${departmentsCount} khoa/bộ môn đang được theo dõi`,
        icon: <Building2 size={24} />,
        accent: "purple",
      },
    ];
  }, [backlogRows.length, departmentRows.length, overviewRow, riskRows.length]);

  const atRiskIssues = useMemo(() => buildIssues(riskRows), [riskRows]);
  const backlogIssues = useMemo(() => buildIssues(backlogRows), [backlogRows]);
  const departmentBreakdown = useMemo(() => buildDepartments(departmentRows), [departmentRows]);

  const actions = [
    { label: "Mở quản trị dữ liệu", to: "/student-service/academic-data" },
    { label: "Quản lý sinh viên", to: "/student-service/students" },
    { label: "Quản lý giảng viên", to: "/student-service/lecturers" },
    { label: "Quản lý đề tài", to: "/student-service/topics" },
  ];

  if (loading) {
    return (
      <div className="student-service-dashboard">
        <div className="ssd-shell">
          <div className="ssd-hero">
            <div className="ssd-hero__eyebrow">
              <Sparkles size={14} />
              Student Service Dashboard
            </div>
            <h1 className="ssd-hero__title">Đang tải dữ liệu dashboard...</h1>
            <p className="ssd-hero__desc">
              Hệ thống đang đồng bộ dữ liệu từ các API student-service.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-service-dashboard">
        <div className="ssd-shell">
          <div className="ssd-hero">
            <div className="ssd-hero__eyebrow">
              <Sparkles size={14} />
              Student Service Dashboard
            </div>
            <h1 className="ssd-hero__title">Không thể tải dashboard</h1>
            <p className="ssd-hero__desc">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-service-dashboard">
      <div className="ssd-shell">
        <section className="ssd-hero">
          <div className="ssd-hero__eyebrow">
            <Sparkles size={14} />
            Student Service Dashboard
          </div>
          <div className="ssd-hero__content">
            <div>
              <h1 className="ssd-hero__title">Bảng điều khiển student-service</h1>
              <p className="ssd-hero__desc">
                Tổng hợp trạng thái đề tài, các mục cần xử lý gấp, và phân bổ theo khoa/bộ môn
                từ các API student-service.
              </p>
            </div>
            <button type="button" className="ssd-refresh-btn" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              Làm mới dữ liệu
            </button>
          </div>
        </section>

        <section className="ssd-stat-grid">
          {stats.map((stat) => (
            <article key={stat.label} className={`ssd-stat-card ${stat.accent}`}>
              <div className="ssd-stat-card__icon">{stat.icon}</div>
              <div className="ssd-stat-card__body">
                <div className="ssd-stat-card__label">{stat.label}</div>
                <div className="ssd-stat-card__value">{stat.value.toLocaleString()}</div>
                <div className="ssd-stat-card__hint">{stat.hint}</div>
              </div>
            </article>
          ))}
        </section>

        <section className="ssd-main-grid">
          <article className="ssd-panel ssd-panel--wide">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Cảnh báo ưu tiên</div>
                <h2 className="ssd-panel__title">Các mục cần xử lý ngay</h2>
              </div>
              <AlertTriangle size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-issue-list">
              {atRiskIssues.length === 0 ? (
                <div className="ssd-empty-state">Chưa có dữ liệu cảnh báo.</div>
              ) : (
                atRiskIssues.map((issue, index) => (
                  <div key={`${issue.title}-${index}`} className="ssd-issue-item">
                    <div className="ssd-issue-item__main">
                      <div className="ssd-issue-item__title">{issue.title}</div>
                      <div className="ssd-issue-item__subtitle">{issue.subtitle}</div>
                    </div>
                    <div className="ssd-issue-item__meta">
                      <span className={`ssd-status-badge ${statusTone(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className="ssd-issue-item__date">{issue.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="ssd-panel">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Hành động nhanh</div>
                <h2 className="ssd-panel__title">Điều hướng module</h2>
              </div>
              <Layers3 size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-action-list">
              {actions.map((action) => (
                <Link key={action.to} to={action.to} className="ssd-action-card">
                  <span>{action.label}</span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="ssd-main-grid">
          <article className="ssd-panel">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Tồn đọng gần đây</div>
                <h2 className="ssd-panel__title">Danh sách backlog</h2>
              </div>
              <ClipboardList size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-issue-list">
              {backlogIssues.length === 0 ? (
                <div className="ssd-empty-state">Chưa có dữ liệu backlog.</div>
              ) : (
                backlogIssues.map((issue, index) => (
                  <div key={`${issue.title}-${index}`} className="ssd-issue-item compact">
                    <div className="ssd-issue-item__main">
                      <div className="ssd-issue-item__title">{issue.title}</div>
                      <div className="ssd-issue-item__subtitle">{issue.subtitle}</div>
                    </div>
                    <div className="ssd-issue-item__meta stacked">
                      <span className={`ssd-status-badge ${statusTone(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className="ssd-issue-item__date">{issue.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="ssd-panel">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Phân bổ theo khoa</div>
                <h2 className="ssd-panel__title">Tỷ trọng dữ liệu</h2>
              </div>
              <TrendingUp size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-bar-list">
              {departmentBreakdown.length === 0 ? (
                <div className="ssd-empty-state">Chưa có dữ liệu phân bổ theo khoa.</div>
              ) : (
                departmentBreakdown.map((row) => {
                  const width = Math.max(8, Math.round((row.value / maxDepartmentValue) * 100));
                  return (
                    <div key={row.label} className="ssd-bar-row">
                      <div className="ssd-bar-row__head">
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                      <div className="ssd-bar-track">
                        <div className="ssd-bar-fill" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </section>

        <section className="ssd-footer-grid">
          <article className="ssd-panel">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Tổng quan nhanh</div>
                <h2 className="ssd-panel__title">Trạng thái hệ thống</h2>
              </div>
              <Users size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-mini-summary">
              <div className="ssd-mini-summary__item">
                <span>Đề tài cần duyệt</span>
                <strong>{readDashboardNumber(overviewRow, ["PENDING_APPROVALS", "pendingApprovals", "topicsPending"], 0).toLocaleString()}</strong>
              </div>
              <div className="ssd-mini-summary__item">
                <span>Đề tài có rủi ro</span>
                <strong>{readDashboardNumber(overviewRow, ["AT_RISK_TOPICS", "atRiskTopics", "riskCount"], riskRows.length).toLocaleString()}</strong>
              </div>
              <div className="ssd-mini-summary__item">
                <span>Tồn đọng</span>
                <strong>{readDashboardNumber(overviewRow, ["BACKLOG_COUNT", "backlogCount"], backlogRows.length).toLocaleString()}</strong>
              </div>
            </div>
          </article>

          <article className="ssd-panel">
            <div className="ssd-panel__header">
              <div>
                <div className="ssd-panel__eyebrow">Nhắc nhanh</div>
                <h2 className="ssd-panel__title">Ghi chú vận hành</h2>
              </div>
              <BookOpen size={18} className="ssd-panel__badge-icon" />
            </div>
            <div className="ssd-notes">
              <div className="ssd-note">
                <strong>1.</strong> Dữ liệu đang lấy trực tiếp từ các API student-service.
              </div>
              <div className="ssd-note">
                <strong>2.</strong> Giao diện dashboard và CSS được tách riêng để không phụ thuộc admin style.
              </div>
              <div className="ssd-note">
                <strong>3.</strong> Các module CRUD vẫn nằm trong trang Academic Data Hub.
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default StudentServiceDashboard;

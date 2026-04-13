import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import DefenseTermQuickInfo from "../../components/admin/DefenseTermQuickInfo";
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import {
  getLecturerCode,
  setLecturerCode,
} from "../../services/auth-session.service";
import {
  getLecturerDeadlineRisk,
  getLecturerOverview,
  getLecturerReviewQueue,
  getLecturerScoringProgress,
  getLecturerWorkloadSnapshot,
  normalizeDashboardItems,
  normalizeDashboardResponse,
  readDashboardNumber,
  readDashboardString,
  type DashboardRecord,
} from "../../services/dashboard.service";
import type { ApiResponse } from "../../types/api";
import type { LecturerProfile } from "../../types/lecturer";

interface DashboardStats {
  totalStudents: number;
  approvedTopics: number;
  pendingReviews: number;
  upcomingDefenses: number;
  completedReports: number;
}

interface RecentActivity {
  id: string;
  type:
    | "topic_submission"
    | "report_review"
    | "defense_scheduled"
    | "committee_meeting";
  title: string;
  description: string;
  timestamp: string;
  status: "pending" | "completed" | "urgent";
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "defense" | "meeting" | "deadline";
  location?: string;
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

async function resolveLecturerCodeFromSession(
  userCode: string,
): Promise<string> {
  const cachedLecturerCode = normalizeText(getLecturerCode());
  if (cachedLecturerCode) {
    return cachedLecturerCode;
  }

  if (!userCode) {
    return "";
  }

  const lecturerProfileResponse = (await fetchData(
    `/LecturerProfiles/get-list?UserCode=${encodeURIComponent(userCode)}`,
  )) as ApiResponse<LecturerProfile[]>;
  const lecturerCode = normalizeText(
    lecturerProfileResponse.data?.[0]?.lecturerCode,
  );
  setLecturerCode(lecturerCode || null);
  return lecturerCode;
}

function formatTimestamp(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return "--";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleString("vi-VN");
}

function formatDate(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return "--";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString("vi-VN");
}

function getActivityIcon(type: string) {
  switch (type) {
    case "topic_submission":
      return <FileText size={16} color="#F37021" />;
    case "report_review":
      return <CheckCircle size={16} color="#22C55E" />;
    case "defense_scheduled":
      return <Calendar size={16} color="#F59E0B" />;
    case "committee_meeting":
      return <Users size={16} color="#8B5CF6" />;
    default:
      return <Bell size={16} color="#6B7280" />;
  }
}

function getActivityStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "#F59E0B";
    case "completed":
      return "#22C55E";
    case "urgent":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

function getEventTypeColor(type: string) {
  switch (type) {
    case "defense":
      return "#F37021";
    case "meeting":
      return "#8B5CF6";
    case "deadline":
      return "#EF4444";
    default:
      return "#6B7280";
  }
}

function resolveActivityType(row: DashboardRecord): RecentActivity["type"] {
  const value = normalizeText(
    readDashboardString(row, ["type", "category", "kind", "status"], ""),
  ).toLowerCase();
  if (value.includes("meeting") || value.includes("committee")) {
    return "committee_meeting";
  }
  if (value.includes("defense") || value.includes("schedule")) {
    return "defense_scheduled";
  }
  if (value.includes("review") || value.includes("report")) {
    return "report_review";
  }
  return "topic_submission";
}

function resolveActivityStatus(row: DashboardRecord): RecentActivity["status"] {
  const value = normalizeText(
    readDashboardString(row, ["status", "state", "activityStatus"], ""),
  ).toLowerCase();
  if (
    value.includes("urgent") ||
    value.includes("late") ||
    value.includes("overdue")
  ) {
    return "urgent";
  }
  if (
    value.includes("done") ||
    value.includes("complete") ||
    value.includes("approved")
  ) {
    return "completed";
  }
  return "pending";
}

function resolveActivityTitle(row: DashboardRecord): string {
  return (
    readDashboardString(
      row,
      ["submissionCode", "submissionID", "topicTitle", "topic_title"],
      "",
    ) ||
    readDashboardString(
      row,
      ["title", "name", "topicCode", "studentFullName"],
      "",
    ) ||
    "Hoạt động mới"
  );
}

function resolveActivityDescription(row: DashboardRecord): string {
  return (
    readDashboardString(
      row,
      ["studentFullName", "studentCode", "hoursWaitingReview", "lecturerState"],
      "",
    ) ||
    readDashboardString(
      row,
      ["description", "desc", "message", "content"],
      "",
    ) ||
    "Hoạt động mới"
  );
}

function resolveActivityTimestamp(row: DashboardRecord): string {
  return formatTimestamp(
    readDashboardString(
      row,
      ["submittedAt", "createdAt", "lastUpdated", "updatedAt"],
      "",
    ),
  );
}

function resolveEventType(row: DashboardRecord): UpcomingEvent["type"] {
  const value = normalizeText(
    readDashboardString(row, ["type", "category", "kind", "status"], ""),
  ).toLowerCase();
  if (value.includes("meeting")) return "meeting";
  if (value.includes("deadline") || value.includes("due")) return "deadline";
  return "defense";
}

function resolveEventTitle(row: DashboardRecord): string {
  return (
    readDashboardString(
      row,
      ["itemCode", "topicCode", "topicTitle", "riskType"],
      "",
    ) ||
    readDashboardString(row, ["title", "name", "eventTitle"], "") ||
    "Sự kiện"
  );
}

function resolveEventLocation(row: DashboardRecord): string | undefined {
  const value = readDashboardString(
    row,
    ["location", "room", "venue", "riskLevel"],
    "",
  );
  return value || undefined;
}

function resolveEventTime(row: DashboardRecord): string {
  const value = readDashboardString(
    row,
    ["hoursOverdue", "time", "eventTime", "startTime"],
    "",
  );
  if (value) {
    return value;
  }
  const timestamp = readDashboardString(
    row,
    ["deadline", "date", "defenseDate", "scheduledAt"],
    "",
  );
  if (!timestamp) return "--";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildActivities(rows: DashboardRecord[]): RecentActivity[] {
  return rows.slice(0, 4).map((row, index) => ({
    id: `${index}-${resolveActivityTitle(row)}`,
    type: resolveActivityType(row),
    title: resolveActivityTitle(row),
    description: resolveActivityDescription(row),
    timestamp: resolveActivityTimestamp(row),
    status: resolveActivityStatus(row),
  }));
}

function buildEvents(rows: DashboardRecord[]): UpcomingEvent[] {
  return rows.slice(0, 3).map((row, index) => ({
    id: `${index}-${resolveEventTitle(row)}`,
    title: resolveEventTitle(row),
    date: formatDate(
      readDashboardString(row, ["date", "defenseDate", "scheduledAt"], ""),
    ),
    time: resolveEventTime(row),
    type: resolveEventType(row),
    location: resolveEventLocation(row),
  }));
}

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [overviewRows, setOverviewRows] = useState<DashboardRecord[]>([]);
  const [reviewRows, setReviewRows] = useState<DashboardRecord[]>([]);
  const [scoringRows, setScoringRows] = useState<DashboardRecord[]>([]);
  const [riskRows, setRiskRows] = useState<DashboardRecord[]>([]);
  const [workloadRows, setWorkloadRows] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const lecturerCode = await resolveLecturerCodeFromSession(
          normalizeText(auth.user?.userCode),
        );
        const overviewQuery = lecturerCode ? { lecturerCode } : {};
        const listQuery = lecturerCode
          ? { lecturerCode, limit: 10 }
          : { limit: 10 };
        const workloadQuery = lecturerCode
          ? { lecturerCode, days: 30 }
          : { days: 30 };

        const [
          overviewResponse,
          reviewQueueResponse,
          scoringResponse,
          riskResponse,
          workloadResponse,
        ] = await Promise.all([
          getLecturerOverview(overviewQuery),
          getLecturerReviewQueue(listQuery),
          getLecturerScoringProgress(listQuery),
          getLecturerDeadlineRisk(listQuery),
          getLecturerWorkloadSnapshot(workloadQuery),
        ]);

        if (cancelled) {
          return;
        }

        setOverviewRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(overviewResponse),
          ),
        );
        setReviewRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(reviewQueueResponse),
          ),
        );
        setScoringRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(scoringResponse),
          ),
        );
        setRiskRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(riskResponse),
          ),
        );
        setWorkloadRows(
          normalizeDashboardItems<DashboardRecord>(
            normalizeDashboardResponse(workloadResponse),
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu dashboard giảng viên.",
          );
          setOverviewRows([]);
          setReviewRows([]);
          setScoringRows([]);
          setRiskRows([]);
          setWorkloadRows([]);
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
  }, [auth.user?.userCode]);

  const stats = useMemo<DashboardStats>(() => {
    const overviewRow = overviewRows[0] ?? {};
    const scoringRow = scoringRows[0] ?? {};
    const workloadRow = workloadRows[0] ?? {};

    return {
      totalStudents: readDashboardNumber(
        overviewRow,
        ["CURRENTGUIDINGCOUNT", "currentGuidingCount"],
        0,
      ),
      approvedTopics: readDashboardNumber(
        overviewRow,
        ["TOPICS_PENDING_APPROVAL", "topicsPendingApproval"],
        0,
      ),
      pendingReviews: readDashboardNumber(
        overviewRow,
        ["PROGRESS_PENDING_REVIEW", "progressPendingReview"],
        0,
      ),
      upcomingDefenses: readDashboardNumber(
        overviewRow,
        ["UPCOMING_DEFENSE_7D", "upcomingDefense7d"],
        0,
      ),
      completedReports:
        readDashboardNumber(
          overviewRow,
          ["HIGH_RISK_ITEMS", "highRiskItems"],
          readDashboardNumber(scoringRow, ["OVERDUE_COUNT", "overdueCount"], 0),
        ) ||
        readDashboardNumber(
          workloadRow,
          ["HIGH_RISK_ITEMS", "highRiskItems"],
          0,
        ),
    };
  }, [overviewRows, scoringRows, workloadRows]);

  const recentActivities = useMemo(
    () => buildActivities(reviewRows),
    [reviewRows],
  );
  const upcomingEvents = useMemo(() => buildEvents(riskRows), [riskRows]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 20 }}>Đang tải...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "red" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px !important;
          }

          .dashboard-header h1 {
            font-size: 22px !important;
          }

          .dashboard-header p {
            font-size: 13px !important;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }

          .stat-card {
            padding: 16px !important;
          }

          .stat-card .stat-value {
            font-size: 24px !important;
          }

          .stat-card .stat-label {
            font-size: 12px !important;
          }

          .main-content-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .activity-card {
            padding: 12px !important;
          }

          .activity-title {
            font-size: 13px !important;
          }

          .activity-description {
            font-size: 12px !important;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .action-button {
            padding: 12px !important;
            font-size: 13px !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }

          .main-content-grid {
            grid-template-columns: 1fr !important;
          }

          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <div className="dashboard-header" style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <BarChart3 size={32} color="#F37021" />
          Bảng điều khiển
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Tổng quan về hoạt động hướng dẫn và quản lý đề tài luận văn
        </p>
      </div>

      <DefenseTermQuickInfo
        roleLabel="Giảng viên"
        termCode="2026.1"
        termName="Đợt bảo vệ HK2 năm học 2025-2026"
        roundIndex={1}
        status="Preparing"
      />

      {/* Stats Cards */}
      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
            border: "1px solid #F37021",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <Users size={24} color="#F37021" style={{ marginBottom: "12px" }} />
          <div
            className="stat-value"
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#F37021",
              marginBottom: "4px",
            }}
          >
            {stats.totalStudents}
          </div>
          <div
            className="stat-label"
            style={{ fontSize: "14px", color: "#666" }}
          >
            Sinh viên đang hướng dẫn
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
            border: "1px solid #22C55E",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <CheckCircle
            size={24}
            color="#22C55E"
            style={{ marginBottom: "12px" }}
          />
          <div
            className="stat-value"
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#22C55E",
              marginBottom: "4px",
            }}
          >
            {stats.approvedTopics}
          </div>
          <div
            className="stat-label"
            style={{ fontSize: "14px", color: "#666" }}
          >
            Đề tài chờ duyệt
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <Clock size={24} color="#F59E0B" style={{ marginBottom: "12px" }} />
          <div
            className="stat-value"
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#F59E0B",
              marginBottom: "4px",
            }}
          >
            {stats.pendingReviews}
          </div>
          <div
            className="stat-label"
            style={{ fontSize: "14px", color: "#666" }}
          >
            Tiến độ chờ review
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
            border: "1px solid #8B5CF6",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <Calendar
            size={24}
            color="#8B5CF6"
            style={{ marginBottom: "12px" }}
          />
          <div
            className="stat-value"
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#8B5CF6",
              marginBottom: "4px",
            }}
          >
            {stats.upcomingDefenses}
          </div>
          <div
            className="stat-label"
            style={{ fontSize: "14px", color: "#666" }}
          >
            Bảo vệ 7 ngày
          </div>
        </div>
      </div>

      <div
        className="main-content-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            className="activity-card"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <UserCheck size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Hoạt động gần đây
              </h2>
            </div>

            {recentActivities.length === 0 ? (
              <div style={{ color: "#6B7280" }}>Chưa có hoạt động mới.</div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      padding: "16px",
                      background: "#F9FAFB",
                      borderRadius: "16px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="activity-title"
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        {activity.title}
                      </div>
                      <div
                        className="activity-description"
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                          marginBottom: "6px",
                        }}
                      >
                        {activity.description}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        {activity.timestamp}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        marginTop: 6,
                        background: getActivityStatusColor(activity.status),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <MessageSquare size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Tiến độ và hội đồng sắp tới
              </h2>
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={{ color: "#6B7280" }}>Chưa có sự kiện mới.</div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: "16px",
                      background: "linear-gradient(135deg, #fff, #F9FAFB)",
                      borderRadius: "16px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {event.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#6B7280",
                            marginTop: 6,
                          }}
                        >
                          {event.date} · {event.time}
                        </div>
                        {event.location && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#6B7280",
                              marginTop: 4,
                            }}
                          >
                            {event.location}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          color: getEventTypeColor(event.type),
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                        }}
                      >
                        {event.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <TrendingUp size={22} color="#F37021" />
              <h3 style={{ margin: 0, fontSize: 20, color: "#1F2937" }}>
                Tóm tắt
              </h3>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{ padding: 14, background: "#FFF7ED", borderRadius: 14 }}
              >
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  Chỉ tiêu hướng dẫn
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: "#F37021" }}
                >
                  {stats.approvedTopics}
                </div>
              </div>
              <div
                style={{ padding: 14, background: "#FEFCE8", borderRadius: 14 }}
              >
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  Chỉ tiêu bảo vệ
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: "#F59E0B" }}
                >
                  {stats.pendingReviews}
                </div>
              </div>
              <div
                style={{ padding: 14, background: "#EEF2FF", borderRadius: 14 }}
              >
                <div style={{ fontSize: 12, color: "#6B7280" }}>Rủi ro cao</div>
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: "#8B5CF6" }}
                >
                  {stats.upcomingDefenses}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <Bell size={22} color="#F37021" />
              <h3 style={{ margin: 0, fontSize: 20, color: "#1F2937" }}>
                Thao tác nhanh
              </h3>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Xem danh sách sinh viên",
                "Duyệt báo cáo tiến độ",
                "Xem lịch bảo vệ",
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    padding: "12px 14px",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  <span>{label}</span>
                  <ChevronRight size={16} color="#F37021" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

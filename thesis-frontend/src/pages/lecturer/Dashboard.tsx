import React, { useState } from "react";
import {
  BarChart3,
  Users,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  BookOpen,
  UserCheck,
  MessageSquare,
  Bell,
  ChevronRight,
} from "lucide-react";
import DefenseTermQuickInfo from "../../components/admin/DefenseTermQuickInfo";

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

const Dashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>({
    totalStudents: 12,
    approvedTopics: 8,
    pendingReviews: 4,
    upcomingDefenses: 3,
    completedReports: 6,
  });

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "topic_submission",
      title: "Đề tài mới: Ứng dụng AI trong phân tích dữ liệu",
      description: "Sinh viên Nguyễn Văn A đã nộp đề tài mới",
      timestamp: "2025-10-07 09:30",
      status: "pending",
    },
    {
      id: "2",
      type: "report_review",
      title: "Báo cáo tiến độ tháng 9",
      description: "Đã duyệt báo cáo của Trần Thị B",
      timestamp: "2025-10-06 14:20",
      status: "completed",
    },
    {
      id: "3",
      type: "defense_scheduled",
      title: "Hội đồng bảo vệ sắp tới",
      description: "Hội đồng CNTT-01 sẽ bảo vệ vào tuần sau",
      timestamp: "2025-10-05 16:45",
      status: "urgent",
    },
    {
      id: "4",
      type: "committee_meeting",
      title: "Cuộc họp hội đồng",
      description: "Thảo luận về đề tài của Lê Văn C",
      timestamp: "2025-10-04 11:15",
      status: "completed",
    },
  ]);

  const [upcomingEvents] = useState<UpcomingEvent[]>([
    {
      id: "1",
      title: "Hội đồng bảo vệ CNTT-01",
      date: "2025-10-15",
      time: "14:00",
      type: "defense",
      location: "Phòng hội thảo A101",
    },
    {
      id: "2",
      title: "Hạn nộp báo cáo tiến độ tháng 10",
      date: "2025-10-20",
      time: "23:59",
      type: "deadline",
    },
    {
      id: "3",
      title: "Cuộc họp hội đồng xét duyệt đề tài",
      date: "2025-10-18",
      time: "09:00",
      type: "meeting",
      location: "Phòng họp B205",
    },
  ]);

  const getActivityIcon = (type: string) => {
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
  };

  const getActivityStatusColor = (status: string) => {
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
  };

  const getEventTypeColor = (type: string) => {
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
  };

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
      {/* Header */}
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
            Sinh viên hướng dẫn
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
            Đề tài đã duyệt
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
            Chờ xem xét
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
            border: "1px solid #6366F1",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <Calendar
            size={24}
            color="#6366F1"
            style={{ marginBottom: "12px" }}
          />
          <div
            className="stat-value"
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#6366F1",
              marginBottom: "4px",
            }}
          >
            {stats.upcomingDefenses}
          </div>
          <div
            className="stat-label"
            style={{ fontSize: "14px", color: "#666" }}
          >
            Bảo vệ sắp tới
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        className="main-content-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Recent Activities */}
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TrendingUp size={20} color="#F37021" />
            Hoạt động gần đây
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="activity-card"
                style={{
                  display: "flex",
                  alignItems: "start",
                  gap: "12px",
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${getActivityStatusColor(
                    activity.status
                  )}`,
                }}
              >
                <div style={{ marginTop: "2px" }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    className="activity-title"
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "4px",
                    }}
                  >
                    {activity.title}
                  </div>
                  <div
                    className="activity-description"
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "8px",
                    }}
                  >
                    {activity.description}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                    }}
                  >
                    {activity.timestamp}
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 8px",
                    background: getActivityStatusColor(activity.status),
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {activity.status === "pending"
                    ? "Chờ xử lý"
                    : activity.status === "completed"
                    ? "Hoàn thành"
                    : activity.status === "urgent"
                    ? "Khẩn cấp"
                    : "Không xác định"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          style={{
            background: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Calendar size={20} color="#F37021" />
            Sự kiện sắp tới
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${getEventTypeColor(event.type)}`,
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "8px",
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar size={14} />
                    {event.date}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={14} />
                    {event.time}
                  </div>
                </div>
                {event.location && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                      marginTop: "4px",
                    }}
                  >
                    📍 {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MessageSquare size={20} color="#F37021" />
          Hành động nhanh
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
          className="quick-actions-grid"
        >
          <button
            className="action-button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              background: "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
              border: "1px solid #F37021",
              borderRadius: "8px",
              color: "#F37021",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(243, 112, 33, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} />
              Xem đề tài chờ duyệt
            </div>
            <ChevronRight size={16} />
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
              border: "1px solid #22C55E",
              borderRadius: "8px",
              color: "#22C55E",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(34, 197, 94, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={18} />
              Xem sinh viên của tôi
            </div>
            <ChevronRight size={16} />
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
              border: "1px solid #6366F1",
              borderRadius: "8px",
              color: "#6366F1",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(99, 102, 241, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} />
              Lịch bảo vệ
            </div>
            <ChevronRight size={16} />
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              background: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
              border: "1px solid #6B7280",
              borderRadius: "8px",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(107, 114, 128, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={18} />
              Báo cáo tổng hợp
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from "react";
import {
  Users,
  BookOpen,
  FileText,
  CalendarDays,
  Bell,
  TrendingUp,
  Shield,
} from "lucide-react";
import DefenseTermQuickInfo from "../../components/admin/DefenseTermQuickInfo";
import "./Dashboard.css";

// ==========================================
// MOCK DATA - Dữ liệu mẫu để minh họa
// Sau này thay bằng API thực từ backend
// ==========================================

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "orange" | "blue" | "green" | "purple";
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  colorLight: string;
}

interface RecentTopic {
  title: string;
  student: string;
  lecturer: string;
  status: "in-progress" | "pending" | "approved";
  statusText: string;
}

interface Notification {
  title: string;
  desc: string;
  date: string;
}

// Mock Stats Data - Nâng cấp với số liệu nghiêm túc hơn
const mockStats: StatCard[] = [
  {
    label: "TỔNG SỐ SINH VIÊN",
    value: 487,
    icon: <Users size={28} />,
    color: "orange",
  },
  {
    label: "ĐỀ TÀI ĐANG THỰC HIỆN",
    value: 67,
    icon: <BookOpen size={28} />,
    color: "blue",
  },
  {
    label: "BÁO CÁO TUẦN NÀY",
    value: 189,
    icon: <FileText size={28} />,
    color: "green",
  },
  {
    label: "LỊCH BẢO VỆ SẮP TỚI",
    value: 12,
    icon: <CalendarDays size={28} />,
    color: "purple",
  },
];

// Mock Chart Data - Tiến độ hoàn thành đồ án (Nghiêm túc hơn)
const mockChartData: ChartData[] = [
  {
    label: "ĐANG THỰC HIỆN",
    value: 67,
    color: "#f37021",
    colorLight: "#ff9a56",
  },
  {
    label: "ĐÃ HOÀN THÀNH",
    value: 42,
    color: "#2e7d32",
    colorLight: "#4caf50",
  },
  {
    label: "QUÁ HẠN",
    value: 23,
    color: "#ef4444",
    colorLight: "#f87171",
  },
  {
    label: "CHỜ DUYỆT",
    value: 18,
    color: "#f59e0b",
    colorLight: "#fbbf24",
  },
];

// Mock Recent Topics Data - Dữ liệu nghiêm túc hơn
const mockRecentTopics: RecentTopic[] = [
  {
    title: "HỆ THỐNG QUẢN LÝ AN NINH MẠNG DOANH NGHIỆP",
    student: "Nguyễn Văn Đức (SV2024001)",
    lecturer: "PGS.TS Trần Minh Hòa",
    status: "in-progress",
    statusText: "ĐANG THỰC HIỆN",
  },
  {
    title: "ỨNG DỤNG AI TRONG PHÂN TÍCH DỮ LIỆU LỚN",
    student: "Trần Thị Lan (SV2024002)",
    lecturer: "TS. Nguyễn Thu Hà",
    status: "pending",
    statusText: "CHỜ DUYỆT",
  },
  {
    title: "TỐI ƯU HÓA CƠ SỞ DỮ LIỆU PHÂN TÁN",
    student: "Lê Văn Tùng (SV2024003)",
    lecturer: "ThS. Phạm Anh Dũng",
    status: "approved",
    statusText: "ĐÃ DUYỆT",
  },
  {
    title: "HỆ THỐNG IOT CHO NHÀ THÔNG MINH",
    student: "Hoàng Thị Mai (SV2024004)",
    lecturer: "TS. Trần Minh Hòa",
    status: "in-progress",
    statusText: "ĐANG THỰC HIỆN",
  },
  {
    title: "PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG CHO GIÁO DỤC",
    student: "Phạm Văn Hùng (SV2024005)",
    lecturer: "ThS. Lê Thanh Tùng",
    status: "pending",
    statusText: "CHỜ DUYỆT",
  },
];

// Mock Notifications Data - Thông báo nghiêm túc hơn
const mockNotifications: Notification[] = [
  {
    title: "HỘI ĐỒNG BẢO VỆ KỲ 2025.2",
    desc: "Dự kiến tổ chức từ 15/12/2025 - 20/12/2025",
    date: "07/10/2025",
  },
  {
    title: "HẠN NỘP BÁO CÁO TIẾN ĐỘ THÁNG 10",
    desc: "Tất cả sinh viên phải nộp báo cáo trước 23:59 ngày 25/10/2025",
    date: "06/10/2025",
  },
  {
    title: "CUỘC HỌP HỘI ĐỒNG XÉT DUYỆT ĐỀ TÀI",
    desc: "Lịch họp ngày 12/10/2025 tại phòng A101",
    date: "05/10/2025",
  },
  {
    title: "THÔNG BÁO VỀ QUY TRÌNH BẢO VỆ",
    desc: "Cập nhật quy trình bảo vệ luận văn tốt nghiệp 2025",
    date: "04/10/2025",
  },
  {
    title: "HẠN CUỐI ĐĂNG KÝ ĐỀ TÀI",
    desc: "Sinh viên chưa đăng ký đề tài vui lòng hoàn thành trước 15/10/2025",
    date: "03/10/2025",
  },
];

const Dashboard: React.FC = () => {
  // Calculate max value for chart scaling
  const maxChartValue = Math.max(...mockChartData.map((d) => d.value));

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>
          <Shield size={40} style={{ marginRight: 16 }} />
          BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN
        </h1>
        <p>TỔNG QUAN HOẠT ĐỘNG VÀ DỮ LIỆU HỆ THỐNG ĐỒ ÁN TỐT NGHIỆP</p>
      </div>

      <DefenseTermQuickInfo
        roleLabel="Quản trị viên"
        termCode="2026.1"
        termName="Đợt bảo vệ HK2 năm học 2025-2026"
        roundIndex={1}
        status="Preparing"
      />

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {mockStats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-card-header">
              <div className={`stat-card-icon ${stat.color}`}>{stat.icon}</div>
            </div>
            <div className="stat-card-label">{stat.label}</div>
            <div className="stat-card-value">{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Content Grid: Chart + Notifications */}
      <div className="dashboard-content">
        {/* Progress Chart Section */}
        <div className="chart-section">
          <h2>
            <TrendingUp
              size={24}
              style={{ marginRight: 12, color: "#f37021" }}
            />
            TIẾN ĐỘ HOÀN THÀNH ĐỒ ÁN
          </h2>
          <div className="chart-container">
            <div className="bar-chart">
              {mockChartData.map((item, index) => {
                const barHeight = (item.value / maxChartValue) * 250; // 250px max height
                return (
                  <div key={index} className="bar-item">
                    <div
                      className="bar"
                      style={{
                        height: `${Math.max(barHeight, 20)}px`,
                        background: `linear-gradient(to top, ${item.color}, ${item.colorLight})`,
                        minHeight: "20px",
                      }}
                    >
                      <div className="bar-value">{item.value}</div>
                    </div>
                    <div className="bar-label">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="notifications-section">
          <h2>
            <Bell size={24} style={{ color: "#f37021" }} />
            THÔNG BÁO HỆ THỐNG
          </h2>
          <div className="notifications-list">
            {mockNotifications.map((notif, index) => (
              <div key={index} className="notification-item">
                <div className="notification-title">{notif.title}</div>
                <div className="notification-desc">{notif.desc}</div>
                <div className="notification-date">📅 {notif.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Topics Table */}
      <div className="recent-topics-section">
        <h2>ĐỀ TÀI MỚI NHẤT</h2>
        <table className="topics-table">
          <thead>
            <tr>
              <th>TÊN ĐỀ TÀI</th>
              <th>SINH VIÊN</th>
              <th>GIẢNG VIÊN HƯỚNG DẪN</th>
              <th>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {mockRecentTopics.map((topic, index) => (
              <tr key={index}>
                <td style={{ maxWidth: "350px", fontWeight: "600" }}>
                  {topic.title}
                </td>
                <td style={{ fontWeight: "500" }}>{topic.student}</td>
                <td style={{ fontWeight: "500" }}>{topic.lecturer}</td>
                <td>
                  <span className={`status-badge ${topic.status}`}>
                    {topic.statusText}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

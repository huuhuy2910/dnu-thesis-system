import React from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  CalendarDays,
  Bell,
  TrendingUp
} from 'lucide-react';
import './Dashboard.css';

// ==========================================
// MOCK DATA - Dữ liệu mẫu để minh họa
// Sau này thay bằng API thực từ backend
// ==========================================

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'orange' | 'blue' | 'green' | 'purple';
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
  status: 'in-progress' | 'pending' | 'approved';
  statusText: string;
}

interface Notification {
  title: string;
  desc: string;
  date: string;
}

// Mock Stats Data
const mockStats: StatCard[] = [
  {
    label: 'Tổng số sinh viên',
    value: 324,
    icon: <Users size={24} />,
    color: 'orange'
  },
  {
    label: 'Đề tài đang thực hiện',
    value: 45,
    icon: <BookOpen size={24} />,
    color: 'blue'
  },
  {
    label: 'Báo cáo nộp tuần này',
    value: 132,
    icon: <FileText size={24} />,
    color: 'green'
  },
  {
    label: 'Lịch bảo vệ sắp tới',
    value: 8,
    icon: <CalendarDays size={24} />,
    color: 'purple'
  }
];

// Mock Chart Data - Tiến độ hoàn thành đồ án
const mockChartData: ChartData[] = [
  { label: 'Đang thực hiện', value: 45, color: '#f37021', colorLight: '#ff9a56' },
  { label: 'Đã hoàn thành', value: 30, color: '#2e7d32', colorLight: '#66bb6a' },
  { label: 'Quá hạn', value: 15, color: '#d32f2f', colorLight: '#ef5350' },
  { label: 'Chờ duyệt', value: 10, color: '#1e88e5', colorLight: '#42a5f5' }
];

// Mock Recent Topics Data
const mockRecentTopics: RecentTopic[] = [
  {
    title: 'Hệ gợi ý học tập',
    student: 'Nguyễn Văn A',
    lecturer: 'TS. Trần Minh Hòa',
    status: 'in-progress',
    statusText: 'Đang thực hiện'
  },
  {
    title: 'Phân loại văn bản tiếng Việt',
    student: 'Trần Thị B',
    lecturer: 'ThS. Nguyễn Thu Hà',
    status: 'pending',
    statusText: 'Chờ duyệt'
  },
  {
    title: 'Tối ưu hóa DB phân tán',
    student: 'Lê Văn C',
    lecturer: 'ThS. Phạm Anh Dũng',
    status: 'approved',
    statusText: 'Đã duyệt'
  }
];

// Mock Notifications Data
const mockNotifications: Notification[] = [
  {
    title: 'Hội đồng bảo vệ K17',
    desc: 'Dự kiến tổ chức 25/12/2025',
    date: '03/10/2025'
  },
  {
    title: 'Báo cáo tuần 3',
    desc: 'Hạn chót nộp: 10/10/2025',
    date: '02/10/2025'
  },
  {
    title: 'Đợt bảo vệ tháng 11',
    desc: 'Cập nhật lịch họp hội đồng',
    date: '01/10/2025'
  }
];

const Dashboard: React.FC = () => {
  // Calculate max value for chart scaling
  const maxChartValue = Math.max(...mockChartData.map(d => d.value));

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Bảng điều khiển Quản trị viên</h1>
        <p>Tổng quan hoạt động và dữ liệu của hệ thống đồ án tốt nghiệp.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {mockStats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-card-header">
              <div className={`stat-card-icon ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <div className="stat-card-label">{stat.label}</div>
            <div className="stat-card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Content Grid: Chart + Notifications */}
      <div className="dashboard-content">
        {/* Progress Chart Section */}
        <div className="chart-section">
          <h2>
            <TrendingUp size={20} style={{ marginRight: 8, color: '#f37021' }} />
            Tiến độ hoàn thành đồ án (mẫu)
          </h2>
          <div className="chart-container">
            <div className="bar-chart">
              {mockChartData.map((item, index) => (
                <div key={index} className="bar-item">
                  <div
                    className="bar"
                    style={{
                      height: `${(item.value / maxChartValue) * 100}%`,
                      '--bar-color': item.color,
                      '--bar-color-light': item.colorLight
                    } as React.CSSProperties}
                  >
                    <span className="bar-value">{item.value}</span>
                  </div>
                  <div className="bar-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-note">
            📌 Dữ liệu minh họa, sẽ thay bằng API thật sau.
          </div>
        </div>

        {/* Notifications Section */}
        <div className="notifications-section">
          <h2>
            <Bell size={20} style={{ color: '#f37021' }} />
            Thông báo hệ thống
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
        <h2>Đề tài mới nhất</h2>
        <table className="topics-table">
          <thead>
            <tr>
              <th>Tên đề tài</th>
              <th>Sinh viên</th>
              <th>Giảng viên hướng dẫn</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {mockRecentTopics.map((topic, index) => (
              <tr key={index}>
                <td>{topic.title}</td>
                <td>{topic.student}</td>
                <td>{topic.lecturer}</td>
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

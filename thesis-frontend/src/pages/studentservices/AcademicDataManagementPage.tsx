import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "../admin/Dashboard.css";
const managementModules = [
  {
    title: "Quản lý sinh viên",
    description:
      "Theo dõi hồ sơ sinh viên, cập nhật thông tin và đồng bộ dữ liệu.",
    path: "/student-service/students",
  },
  {
    title: "Quản lý giảng viên",
    description: "Quản trị hồ sơ giảng viên, học hàm/học vị và chuyên môn.",
    path: "/student-service/lecturers",
  },
  {
    title: "Quản lý khoa/bộ môn",
    description: "Thiết lập danh mục khoa, bộ môn và trạng thái hoạt động.",
    path: "/student-service/departments",
  },
  {
    title: "Quản lý đề tài",
    description:
      "Quản trị danh mục đề tài, giảng viên đề xuất và trạng thái duyệt.",
    path: "/student-service/topics",
  },
];

const AcademicDataManagementPage: React.FC = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Student Service Dashboard</h1>
        <p>Trang tổng quan điều hướng đến các module dữ liệu học thuật.</p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: 18,
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
          Mỗi module hiện đã có giao diện và logic riêng để bạn tùy biến CSS
          theo từng màn hình. Từ dashboard này, chọn module để vào trang quản lý
          tương ứng.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {managementModules.map((module) => (
          <Link
            key={module.path}
            to={module.path}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
              display: "grid",
              gap: 10,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
              {module.title}
            </h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.45 }}>
              {module.description}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#f37021",
                fontWeight: 600,
              }}
            >
              Truy cập module <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AcademicDataManagementPage;

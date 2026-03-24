import React from "react";
import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../admin/Dashboard.css";
const managementModules = [
  {
    title: "Quản lý sinh viên",
    description:
      "Chuẩn hóa dữ liệu hồ sơ sinh viên theo studentCode, classCode, facultyCode, gpa.",
    path: "/students",
    keyFields: ["studentCode", "classCode", "facultyCode", "studentEmail"],
  },
  {
    title: "Quản lý giảng viên",
    description:
      "Quản trị hồ sơ giảng viên theo degree, email, guideQuota, defenseQuota.",
    path: "/lecturers",
    keyFields: ["lecturerCode", "degree", "email", "guideQuota"],
  },
  {
    title: "Quản lý khoa/bộ môn",
    description:
      "Danh mục khoa/bộ môn theo bộ field chuẩn departmentCode, name, description.",
    path: "/departments",
    keyFields: ["departmentCode", "name", "description"],
  },
  {
    title: "Quản lý đề tài",
    description:
      "Quản trị đề tài theo title, summary, proposerUserCode, supervisorLecturerCode, status.",
    path: "/topics",
    keyFields: ["topicCode", "title", "proposerUserCode", "status"],
  },
  {
    title: "Quản lý tags",
    description:
      "Quản trị danh mục tag theo tagCode, tagName, description và import dữ liệu.",
    path: "/tags",
    keyFields: ["tagCode", "tagName", "description"],
  },
  {
    title: "Kho đề tài có sẵn",
    description:
      "Import CatalogTopics theo file mẫu và đồng bộ CatalogTopicTags qua cột tagCodes.",
    path: "/catalogtopics",
    keyFields: ["catalogTopicCode", "title", "departmentCode", "tagCodes"],
  },
];

const AcademicDataManagementPage: React.FC = () => {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/admin")
    ? "/admin"
    : "/student-service";

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Academic Data Hub</h1>
        <p>Chọn module để quản trị dữ liệu theo đúng schema chuẩn của API.</p>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%)",
          borderRadius: 16,
          border: "1px solid #fed7aa",
          boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
          padding: 20,
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
          Giao diện các module đã được chuẩn hóa field theo API mẫu mới. Mỗi thẻ
          bên dưới hiển thị nhóm trường chính để bạn kiểm tra nhanh trước khi
          thao tác CRUD, import/export và lọc dữ liệu.
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
            to={`${basePath}${module.path}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
              border: "1px solid #dbeafe",
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
              display: "grid",
              gap: 12,
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
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {module.keyFields.map((field) => (
                <span
                  key={field}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 999,
                    padding: "4px 10px",
                  }}
                >
                  {field}
                </span>
              ))}
            </div>
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

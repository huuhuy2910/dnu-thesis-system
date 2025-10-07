import React, { useState } from "react";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Student {
  studentCode: string;
  studentName: string;
  email: string;
  phone: string;
  topicTitle: string;
  topicCode: string;
  registrationDate: string;
  status: "approved" | "pending" | "rejected";
  progress: number;
  lastActivity: string;
}

const LecturerStudents: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      studentCode: "SV2024001",
      studentName: "Nguyễn Văn A",
      email: "nguyenvana@student.dnu.edu.vn",
      phone: "0123 456 789",
      topicTitle: "Ứng dụng trí tuệ nhân tạo trong phân tích dữ liệu lớn",
      topicCode: "DT2024001",
      registrationDate: "2025-01-15",
      status: "approved",
      progress: 75,
      lastActivity: "2025-10-01",
    },
    {
      studentCode: "SV2024002",
      studentName: "Trần Thị B",
      email: "tranthib@student.dnu.edu.vn",
      phone: "0987 654 321",
      topicTitle: "Phát triển ứng dụng di động cho giáo dục",
      topicCode: "DT2024002",
      registrationDate: "2025-01-20",
      status: "approved",
      progress: 60,
      lastActivity: "2025-09-28",
    },
    {
      studentCode: "SV2024003",
      studentName: "Lê Văn C",
      email: "levanc@student.dnu.edu.vn",
      phone: "0912 345 678",
      topicTitle: "Hệ thống quản lý thư viện thông minh",
      topicCode: "DT2024003",
      registrationDate: "2025-02-01",
      status: "pending",
      progress: 30,
      lastActivity: "2025-09-25",
    },
    {
      studentCode: "SV2024004",
      studentName: "Phạm Thị D",
      email: "phamthid@student.dnu.edu.vn",
      phone: "0965 432 109",
      topicTitle: "Ứng dụng blockchain trong quản lý chuỗi cung ứng",
      topicCode: "DT2024004",
      registrationDate: "2025-01-25",
      status: "approved",
      progress: 45,
      lastActivity: "2025-09-30",
    },
    {
      studentCode: "SV2024005",
      studentName: "Hoàng Văn E",
      email: "hoangvane@student.dnu.edu.vn",
      phone: "0943 210 987",
      topicTitle: "Phân tích cảm xúc trong mạng xã hội",
      topicCode: "DT2024005",
      registrationDate: "2025-02-05",
      status: "pending",
      progress: 20,
      lastActivity: "2025-09-20",
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} color="#22C55E" />;
      case "pending":
        return <Clock size={16} color="#F59E0B" />;
      case "rejected":
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Từ chối";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
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
          <Users size={32} color="#F37021" />
          Sinh viên hướng dẫn
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Quản lý và theo dõi tiến độ của các sinh viên đang hướng dẫn
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
            border: "1px solid #F37021",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Users size={24} color="#F37021" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#F37021",
              marginBottom: "4px",
            }}
          >
            {students.length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Tổng sinh viên</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
            border: "1px solid #22C55E",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <CheckCircle
            size={24}
            color="#22C55E"
            style={{ marginBottom: "8px" }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#22C55E",
              marginBottom: "4px",
            }}
          >
            {students.filter((s) => s.status === "approved").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Đã duyệt đề tài</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Clock size={24} color="#F59E0B" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#F59E0B",
              marginBottom: "4px",
            }}
          >
            {students.filter((s) => s.status === "pending").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Chờ duyệt</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            border: "1px solid #EF4444",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={24}
            color="#EF4444"
            style={{ marginBottom: "8px" }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#EF4444",
              marginBottom: "4px",
            }}
          >
            {students.filter((s) => s.status === "rejected").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Từ chối</div>
        </div>
      </div>

      {/* Students List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {students.map((student) => (
          <div
            key={student.studentCode}
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* Student Avatar */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #F37021 0%, #FF8838 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(243, 112, 33, 0.3)",
                }}
              >
                {student.studentName.charAt(0)}
              </div>

              {/* Student Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                    }}
                  >
                    {student.studentName}
                  </h3>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      background: getStatusColor(student.status) + "20",
                      color: getStatusColor(student.status),
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {getStatusIcon(student.status)}
                    {getStatusText(student.status)}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <User size={14} color="#666" />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      Mã SV: <strong>{student.studentCode}</strong>
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Mail size={14} color="#666" />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {student.email}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Phone size={14} color="#666" />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      {student.phone}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Calendar size={14} color="#666" />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      Đăng ký:{" "}
                      {new Date(student.registrationDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </div>

                {/* Topic Info */}
                <div
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <BookOpen size={16} color="#F37021" />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                      }}
                    >
                      Đề tài: {student.topicTitle}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      margin: 0,
                    }}
                  >
                    Mã đề tài: {student.topicCode}
                  </p>
                </div>

                {/* Progress */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#666",
                        textTransform: "uppercase",
                      }}
                    >
                      Tiến độ
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                      }}
                    >
                      {student.progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "#E5E7EB",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${student.progress}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, #F37021 0%, #FF8838 100%)",
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <button
                  style={{
                    padding: "8px 16px",
                    background: "#F37021",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E55A1B";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F37021";
                  }}
                >
                  Xem chi tiết
                </button>
                <button
                  style={{
                    padding: "8px 16px",
                    background: "white",
                    color: "#F37021",
                    border: "1px solid #F37021",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FFF5F0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LecturerStudents;

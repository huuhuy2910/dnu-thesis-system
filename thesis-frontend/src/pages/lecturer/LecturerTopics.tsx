import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  User,
  Calendar,
  FileText,
} from "lucide-react";

interface Topic {
  topicCode: string;
  title: string;
  description: string;
  studentCode: string;
  studentName: string;
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "revision";
  category: string;
  priority: "high" | "medium" | "low";
  comments?: string;
}

const LecturerTopics: React.FC = () => {
  const [topics] = useState<Topic[]>([
    {
      topicCode: "DT2024001",
      title: "Ứng dụng trí tuệ nhân tạo trong phân tích dữ liệu lớn",
      description:
        "Nghiên cứu và phát triển hệ thống AI để phân tích dữ liệu lớn trong lĩnh vực kinh doanh và marketing.",
      studentCode: "SV2024001",
      studentName: "Nguyễn Văn A",
      submissionDate: "2025-01-15",
      status: "approved",
      category: "Công nghệ thông tin",
      priority: "high",
    },
    {
      topicCode: "DT2024002",
      title: "Phát triển ứng dụng di động cho giáo dục",
      description:
        "Thiết kế và phát triển ứng dụng di động hỗ trợ học tập trực tuyến cho sinh viên.",
      studentCode: "SV2024002",
      studentName: "Trần Thị B",
      submissionDate: "2025-01-20",
      status: "pending",
      category: "Công nghệ phần mềm",
      priority: "medium",
      comments: "Cần bổ sung thêm về phương pháp nghiên cứu",
    },
    {
      topicCode: "DT2024003",
      title: "Hệ thống quản lý thư viện thông minh",
      description:
        "Xây dựng hệ thống quản lý thư viện sử dụng công nghệ IoT và AI.",
      studentCode: "SV2024003",
      studentName: "Lê Văn C",
      submissionDate: "2025-02-01",
      status: "revision",
      category: "Hệ thống thông tin",
      priority: "medium",
      comments: "Cần làm rõ phạm vi nghiên cứu và mục tiêu cụ thể",
    },
    {
      topicCode: "DT2024004",
      title: "Ứng dụng blockchain trong quản lý chuỗi cung ứng",
      description:
        "Nghiên cứu ứng dụng công nghệ blockchain để tăng tính minh bạch trong quản lý chuỗi cung ứng.",
      studentCode: "SV2024004",
      studentName: "Phạm Thị D",
      submissionDate: "2025-01-25",
      status: "approved",
      category: "Công nghệ blockchain",
      priority: "high",
    },
    {
      topicCode: "DT2024005",
      title: "Phân tích cảm xúc trong mạng xã hội",
      description:
        "Phát triển mô hình AI để phân tích cảm xúc từ dữ liệu mạng xã hội.",
      studentCode: "SV2024005",
      studentName: "Hoàng Văn E",
      submissionDate: "2025-02-05",
      status: "rejected",
      category: "Khoa học dữ liệu",
      priority: "low",
      comments: "Đề tài quá rộng, cần thu hẹp phạm vi nghiên cứu",
    },
  ]);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} color="#22C55E" />;
      case "pending":
        return <Clock size={16} color="#F59E0B" />;
      case "rejected":
        return <AlertCircle size={16} color="#EF4444" />;
      case "revision":
        return <Edit size={16} color="#8B5CF6" />;
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
      case "revision":
        return "Cần sửa đổi";
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
      case "revision":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#22C55E";
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
          <BookOpen size={32} color="#F37021" />
          Đề tài duyệt
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem và duyệt các đề tài luận văn của sinh viên
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
          <BookOpen size={24} color="#F37021" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#F37021",
              marginBottom: "4px",
            }}
          >
            {topics.length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Tổng đề tài</div>
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
            {topics.filter((t) => t.status === "approved").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Đã duyệt</div>
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
            {topics.filter((t) => t.status === "pending").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Chờ duyệt</div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)",
            border: "1px solid #8B5CF6",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Edit size={24} color="#8B5CF6" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#8B5CF6",
              marginBottom: "4px",
            }}
          >
            {topics.filter((t) => t.status === "revision").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Cần sửa đổi</div>
        </div>
      </div>

      {/* Topics List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {topics.map((topic) => (
          <div
            key={topic.topicCode}
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
                gridTemplateColumns: "1fr auto",
                gap: "20px",
                alignItems: "start",
              }}
            >
              {/* Topic Info */}
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
                    {topic.title}
                  </h3>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      background: getStatusColor(topic.status) + "20",
                      color: getStatusColor(topic.status),
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {getStatusIcon(topic.status)}
                    {getStatusText(topic.status)}
                  </span>
                  <span
                    style={{
                      padding: "2px 6px",
                      background: getPriorityColor(topic.priority),
                      color: "white",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {topic.priority === "high"
                      ? "Cao"
                      : topic.priority === "medium"
                      ? "Trung bình"
                      : "Thấp"}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  {topic.description}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                      Sinh viên: <strong>{topic.studentName}</strong> (
                      {topic.studentCode})
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
                      Nộp ngày:{" "}
                      {new Date(topic.submissionDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FileText size={14} color="#666" />
                    <span style={{ fontSize: "14px", color: "#666" }}>
                      Danh mục: {topic.category}
                    </span>
                  </div>
                </div>

                {/* Comments */}
                {topic.comments && (
                  <div
                    style={{
                      background: "#FEF3C7",
                      border: "1px solid #FCD34D",
                      borderRadius: "8px",
                      padding: "12px",
                      marginTop: "16px",
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
                      <AlertCircle size={16} color="#92400E" />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#92400E",
                          textTransform: "uppercase",
                        }}
                      >
                        Nhận xét của giảng viên
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#92400E",
                        margin: 0,
                      }}
                    >
                      {topic.comments}
                    </p>
                  </div>
                )}
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
                  onClick={() => setSelectedTopic(topic)}
                >
                  <Eye size={14} style={{ marginRight: "6px" }} />
                  Xem chi tiết
                </button>

                {topic.status === "pending" && (
                  <>
                    <button
                      style={{
                        padding: "8px 16px",
                        background: "#22C55E",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#16A34A";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#22C55E";
                      }}
                    >
                      <CheckCircle size={14} style={{ marginRight: "6px" }} />
                      Duyệt
                    </button>

                    <button
                      style={{
                        padding: "8px 16px",
                        background: "#EF4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#DC2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#EF4444";
                      }}
                    >
                      <AlertCircle size={14} style={{ marginRight: "6px" }} />
                      Từ chối
                    </button>
                  </>
                )}

                {topic.status === "revision" && (
                  <button
                    style={{
                      padding: "8px 16px",
                      background: "#8B5CF6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#7C3AED";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#8B5CF6";
                    }}
                  >
                    <Edit size={14} style={{ marginRight: "6px" }} />
                    Yêu cầu sửa đổi
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedTopic(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "16px",
              }}
            >
              Chi tiết đề tài
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  Tên đề tài
                </label>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    margin: "4px 0",
                  }}
                >
                  {selectedTopic.title}
                </p>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#666",
                    textTransform: "uppercase",
                  }}
                >
                  Mô tả
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: "4px 0",
                    lineHeight: "1.6",
                  }}
                >
                  {selectedTopic.description}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Sinh viên
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                    }}
                  >
                    {selectedTopic.studentName} ({selectedTopic.studentCode})
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Danh mục
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                    }}
                  >
                    {selectedTopic.category}
                  </p>
                </div>
              </div>

              {selectedTopic.comments && (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Nhận xét
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#92400E",
                      margin: "4px 0",
                      padding: "8px",
                      background: "#FEF3C7",
                      borderRadius: "4px",
                    }}
                  >
                    {selectedTopic.comments}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                style={{
                  padding: "8px 16px",
                  background: "#6B7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedTopic(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerTopics;

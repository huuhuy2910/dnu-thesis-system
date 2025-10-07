import React, { useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface Milestone {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: "completed" | "in-progress" | "pending" | "overdue";
  completedDate?: string;
}

const Progress: React.FC = () => {
  const [milestones] = useState<Milestone[]>([
    {
      id: 1,
      title: "Đăng ký đề tài",
      description: "Hoàn thành đăng ký đề tài và được phê duyệt",
      deadline: "2025-01-15",
      status: "completed",
      completedDate: "2025-01-10",
    },
    {
      id: 2,
      title: "Nộp báo cáo tiến độ lần 1",
      description: "Báo cáo về tình hình nghiên cứu và tiến độ ban đầu",
      deadline: "2025-02-28",
      status: "completed",
      completedDate: "2025-02-25",
    },
    {
      id: 3,
      title: "Nộp báo cáo tiến độ lần 2",
      description: "Báo cáo kết quả nghiên cứu và triển khai",
      deadline: "2025-04-15",
      status: "in-progress",
    },
    {
      id: 4,
      title: "Nộp khóa luận hoàn chỉnh",
      description: "Hoàn thiện và nộp bản khóa luận cuối cùng",
      deadline: "2025-05-20",
      status: "pending",
    },
    {
      id: 5,
      title: "Bảo vệ khóa luận",
      description: "Trình bày và bảo vệ khóa luận trước hội đồng",
      deadline: "2025-06-10",
      status: "pending",
    },
  ]);

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const totalCount = milestones.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#22c55e";
      case "in-progress":
        return "#f37021";
      case "overdue":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={24} color="#22c55e" />;
      case "in-progress":
        return <Clock size={24} color="#f37021" />;
      case "overdue":
        return <AlertCircle size={24} color="#ef4444" />;
      default:
        return <Circle size={24} color="#94a3b8" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "in-progress":
        return "Đang thực hiện";
      case "overdue":
        return "Quá hạn";
      default:
        return "Chưa bắt đầu";
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
          <TrendingUp size={32} color="#f37021" />
          Tiến độ đồ án
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Theo dõi tiến độ thực hiện đồ án tốt nghiệp của bạn
        </p>
      </div>

      {/* Progress Overview */}
      <div
        style={{
          background: "linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%)",
          border: "2px solid #f37021",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "32px",
          boxShadow: "0 4px 12px rgba(243, 112, 33, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "8px",
              }}
            >
              Tổng quan tiến độ
            </h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              {completedCount} / {totalCount} mốc đã hoàn thành
            </p>
          </div>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: `conic-gradient(#f37021 ${progressPercentage}%, #e5e7eb ${progressPercentage}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#f37021",
                }}
              >
                {progressPercentage}%
              </span>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Hoàn thành
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "12px",
            backgroundColor: "#e5e7eb",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPercentage}%`,
              height: "100%",
              background: "linear-gradient(90deg, #f37021 0%, #ff8838 100%)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "24px",
          }}
        >
          Chi tiết các mốc
        </h2>

        <div style={{ position: "relative" }}>
          {/* Timeline line */}
          <div
            style={{
              position: "absolute",
              left: "20px",
              top: "0",
              bottom: "0",
              width: "2px",
              background: "linear-gradient(180deg, #f37021 0%, #e5e7eb 100%)",
            }}
          />

          {/* Milestones */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                style={{
                  display: "flex",
                  gap: "24px",
                  position: "relative",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    border: `3px solid ${getStatusColor(milestone.status)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  {getStatusIcon(milestone.status)}
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    padding: "20px",
                    background:
                      milestone.status === "completed"
                        ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                        : milestone.status === "in-progress"
                        ? "linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%)"
                        : "#fafafa",
                    border: `2px solid ${getStatusColor(milestone.status)}`,
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          marginBottom: "4px",
                        }}
                      >
                        {milestone.title}
                      </h3>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          backgroundColor: getStatusColor(milestone.status),
                          color: "#fff",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {getStatusText(milestone.status)}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        Hạn chót
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        {new Date(milestone.deadline).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: milestone.completedDate ? "12px" : "0",
                    }}
                  >
                    {milestone.description}
                  </p>

                  {milestone.completedDate && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#22c55e",
                        fontWeight: "600",
                      }}
                    >
                      <CheckCircle size={16} />
                      Hoàn thành ngày:{" "}
                      {new Date(milestone.completedDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          background: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#92400e",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          Gợi ý
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: "20px",
            fontSize: "13px",
            color: "#92400e",
            lineHeight: "1.8",
          }}
        >
          <li>Thường xuyên cập nhật tiến độ với giảng viên hướng dẫn</li>
          <li>Hoàn thành các mốc trước thời hạn để có thời gian dự phòng</li>
          <li>Lưu trữ và sao lưu tài liệu thường xuyên</li>
          <li>Liên hệ khoa nếu gặp khó khăn trong quá trình thực hiện</li>
        </ul>
      </div>
    </div>
  );
};

export default Progress;

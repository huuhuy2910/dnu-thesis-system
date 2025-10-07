import React, { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface Report {
  id: number;
  topicCode: string;
  topicTitle: string;
  studentCode: string;
  studentName: string;
  reportType: "progress" | "final" | "revision";
  title: string;
  submittedAt: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  fileUrl?: string;
  comments?: string;
  lecturerComments?: string;
  reviewedAt?: string;
}

const LecturerReports: React.FC = () => {
  const [reports] = useState<Report[]>([
    {
      id: 1,
      topicCode: "DT2024001",
      topicTitle: "Ứng dụng trí tuệ nhân tạo trong phân tích dữ liệu lớn",
      studentCode: "SV2024001",
      studentName: "Nguyễn Văn A",
      reportType: "progress",
      title: "Báo cáo tiến độ lần 1",
      submittedAt: "2025-09-15",
      status: "reviewed",
      fileUrl: "/reports/progress1_sv2024001.pdf",
      comments: "Báo cáo chi tiết về việc thu thập dữ liệu và phân tích sơ bộ",
      lecturerComments:
        "Báo cáo tốt, cần bổ sung thêm phần đánh giá kết quả thử nghiệm",
      reviewedAt: "2025-09-20",
    },
    {
      id: 2,
      topicCode: "DT2024002",
      topicTitle: "Phát triển ứng dụng di động cho giáo dục",
      studentCode: "SV2024002",
      studentName: "Trần Thị B",
      reportType: "progress",
      title: "Báo cáo tiến độ lần 2",
      submittedAt: "2025-10-01",
      status: "pending",
      fileUrl: "/reports/progress2_sv2024002.pdf",
      comments: "Hoàn thành prototype và đang trong quá trình testing",
    },
    {
      id: 3,
      topicCode: "DT2024003",
      topicTitle: "Hệ thống quản lý thư viện thông minh",
      studentCode: "SV2024003",
      studentName: "Lê Văn C",
      reportType: "final",
      title: "Báo cáo luận văn hoàn chỉnh",
      submittedAt: "2025-09-25",
      status: "approved",
      fileUrl: "/reports/final_sv2024003.pdf",
      comments: "Báo cáo đầy đủ, bao gồm source code và hướng dẫn sử dụng",
      lecturerComments: "Báo cáo xuất sắc, đề tài có tính ứng dụng cao",
      reviewedAt: "2025-10-05",
    },
    {
      id: 4,
      topicCode: "DT2024004",
      topicTitle: "Ứng dụng blockchain trong quản lý chuỗi cung ứng",
      studentCode: "SV2024004",
      studentName: "Phạm Thị D",
      reportType: "revision",
      title: "Báo cáo sửa đổi theo yêu cầu",
      submittedAt: "2025-10-08",
      status: "pending",
      fileUrl: "/reports/revision_sv2024004.pdf",
      comments: "Đã sửa đổi theo góp ý của giảng viên hướng dẫn",
    },
    {
      id: 5,
      topicCode: "DT2024005",
      topicTitle: "Phân tích cảm xúc trong mạng xã hội",
      studentCode: "SV2024005",
      studentName: "Hoàng Văn E",
      reportType: "progress",
      title: "Báo cáo tiến độ lần 1",
      submittedAt: "2025-09-10",
      status: "rejected",
      fileUrl: "/reports/progress1_sv2024005.pdf",
      comments: "Báo cáo chưa đầy đủ, thiếu phần phương pháp nghiên cứu",
      lecturerComments: "Cần bổ sung chi tiết về dataset và thuật toán sử dụng",
      reviewedAt: "2025-09-18",
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredReports =
    filterStatus === "all"
      ? reports
      : reports.filter((report) => report.status === filterStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} color="#22C55E" />;
      case "pending":
        return <Clock size={16} color="#F59E0B" />;
      case "reviewed":
        return <Eye size={16} color="#8B5CF6" />;
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
      case "reviewed":
        return "Đã xem";
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
      case "reviewed":
        return "#8B5CF6";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getReportTypeText = (type: string) => {
    switch (type) {
      case "progress":
        return "Báo cáo tiến độ";
      case "final":
        return "Báo cáo hoàn chỉnh";
      case "revision":
        return "Báo cáo sửa đổi";
      default:
        return "Không xác định";
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
          <FileText size={32} color="#F37021" />
          Nhận xét báo cáo
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem và nhận xét các báo cáo của sinh viên
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
          <FileText size={24} color="#F37021" style={{ marginBottom: "8px" }} />
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#F37021",
              marginBottom: "4px",
            }}
          >
            {reports.length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Tổng báo cáo</div>
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
            {reports.filter((r) => r.status === "pending").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Chờ nhận xét</div>
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
            {reports.filter((r) => r.status === "approved").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Đã duyệt</div>
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
            {reports.filter((r) => r.status === "rejected").length}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Từ chối</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#666",
            marginRight: "12px",
          }}
        >
          Lọc theo trạng thái:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #D1D5DB",
            borderRadius: "6px",
            fontSize: "14px",
            background: "white",
          }}
        >
          <option value="all">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="reviewed">Đã xem</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {/* Reports List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {filteredReports.map((report) => (
          <div
            key={report.id}
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
              {/* Report Info */}
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
                    {report.title}
                  </h3>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      background: getStatusColor(report.status) + "20",
                      color: getStatusColor(report.status),
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {getStatusIcon(report.status)}
                    {getStatusText(report.status)}
                  </span>
                  <span
                    style={{
                      padding: "2px 6px",
                      background: "#E0F2FE",
                      color: "#0369A1",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {getReportTypeText(report.reportType)}
                  </span>
                </div>

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
                      Sinh viên: <strong>{report.studentName}</strong> (
                      {report.studentCode})
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
                      Đề tài: {report.topicTitle}
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
                      {new Date(report.submittedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Student Comments */}
                {report.comments && (
                  <div
                    style={{
                      background: "#F9FAFB",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
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
                      <MessageSquare size={14} color="#666" />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#666",
                          textTransform: "uppercase",
                        }}
                      >
                        Ghi chú của sinh viên
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#1a1a1a",
                        margin: 0,
                      }}
                    >
                      {report.comments}
                    </p>
                  </div>
                )}

                {/* Lecturer Comments */}
                {report.lecturerComments && (
                  <div
                    style={{
                      background: "#FEF3C7",
                      border: "1px solid #FCD34D",
                      borderRadius: "8px",
                      padding: "12px",
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
                      <MessageSquare size={14} color="#92400E" />
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
                      {report.lecturerComments}
                    </p>
                    {report.reviewedAt && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#92400E",
                          margin: "4px 0 0 0",
                          opacity: 0.8,
                        }}
                      >
                        Đã nhận xét ngày:{" "}
                        {new Date(report.reviewedAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    )}
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
                {report.fileUrl && (
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
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#E55A1B";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#F37021";
                    }}
                  >
                    <Download size={14} />
                    Tải xuống
                  </button>
                )}

                <button
                  style={{
                    padding: "8px 16px",
                    background: "#6B7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#4B5563";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#6B7280";
                  }}
                  onClick={() => setSelectedReport(report)}
                >
                  <Eye size={14} />
                  Xem chi tiết
                </button>

                {report.status === "pending" && (
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
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#16A34A";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#22C55E";
                      }}
                    >
                      <CheckCircle size={14} />
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
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#DC2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#EF4444";
                      }}
                    >
                      <AlertCircle size={14} />
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
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
          onClick={() => setSelectedReport(null)}
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
              Chi tiết báo cáo
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
                  Tên báo cáo
                </label>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#1a1a1a",
                    margin: "4px 0",
                  }}
                >
                  {selectedReport.title}
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
                    {selectedReport.studentName} ({selectedReport.studentCode})
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
                    Loại báo cáo
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                    }}
                  >
                    {getReportTypeText(selectedReport.reportType)}
                  </p>
                </div>
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
                  Đề tài
                </label>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#1a1a1a",
                    margin: "4px 0",
                  }}
                >
                  {selectedReport.topicTitle}
                </p>
                <p style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>
                  Mã đề tài: {selectedReport.topicCode}
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
                    Ngày nộp
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                    }}
                  >
                    {new Date(selectedReport.submittedAt).toLocaleDateString(
                      "vi-VN"
                    )}
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
                    Trạng thái
                  </label>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: getStatusColor(selectedReport.status) + "20",
                      color: getStatusColor(selectedReport.status),
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "4px",
                    }}
                  >
                    {getStatusText(selectedReport.status)}
                  </span>
                </div>
              </div>

              {selectedReport.comments && (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Ghi chú của sinh viên
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      margin: "4px 0",
                      padding: "8px",
                      background: "#F9FAFB",
                      borderRadius: "4px",
                    }}
                  >
                    {selectedReport.comments}
                  </p>
                </div>
              )}

              {selectedReport.lecturerComments && (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    Nhận xét của giảng viên
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
                    {selectedReport.lecturerComments}
                  </p>
                  {selectedReport.reviewedAt && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#92400E",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Đã nhận xét ngày:{" "}
                      {new Date(selectedReport.reviewedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  )}
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
                onClick={() => setSelectedReport(null)}
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

export default LecturerReports;

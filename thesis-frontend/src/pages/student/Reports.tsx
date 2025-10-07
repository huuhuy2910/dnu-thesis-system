import React, { useState } from "react";
import {
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";

interface Report {
  id: number;
  title: string;
  submittedDate: string;
  status: "approved" | "pending" | "rejected";
  feedback?: string;
  fileUrl?: string;
}

const Reports: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [reports] = useState<Report[]>([
    {
      id: 1,
      title: "Báo cáo tiến độ lần 1",
      submittedDate: "2025-02-25",
      status: "approved",
      feedback: "Báo cáo tốt, tiến độ đúng kế hoạch. Tiếp tục duy trì!",
      fileUrl: "#",
    },
    {
      id: 2,
      title: "Báo cáo nghiên cứu sơ bộ",
      submittedDate: "2025-03-10",
      status: "approved",
      feedback:
        "Nội dung nghiên cứu rõ ràng, cần bổ sung thêm tài liệu tham khảo.",
      fileUrl: "#",
    },
    {
      id: 3,
      title: "Báo cáo tiến độ lần 2",
      submittedDate: "2025-04-12",
      status: "pending",
      fileUrl: "#",
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);

    // Simulate API call
    setTimeout(() => {
      setSuccess("Nộp báo cáo thành công!");
      setReportTitle("");
      setReportDescription("");
      setSelectedFile(null);
      setSubmitting(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#22c55e";
      case "pending":
        return "#f37021";
      case "rejected":
        return "#ef4444";
      default:
        return "#94a3b8";
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
          <FileText size={32} color="#f37021" />
          Nộp báo cáo
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Nộp báo cáo tiến độ và xem lịch sử nộp báo cáo
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
      >
        {/* Upload Form */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            border: "2px solid #f0f0f0",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Upload size={24} color="#f37021" />
            Nộp báo cáo mới
          </h2>

          {success && (
            <div
              style={{
                background: "#dcfce7",
                border: "1px solid #22c55e",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Tiêu đề báo cáo *
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
                placeholder="Nhập tiêu đề báo cáo"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f37021")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Mô tả
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn về báo cáo"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#f37021")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Tải lên file *
              </label>
              <div
                style={{
                  border: "2px dashed #e5e7eb",
                  borderRadius: "8px",
                  padding: "32px",
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#f37021";
                  e.currentTarget.style.backgroundColor = "#fff5f0";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.backgroundColor = "#fafafa";
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <Upload
                  size={48}
                  color="#f37021"
                  style={{ margin: "0 auto 16px" }}
                />
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Kéo thả file vào đây hoặc
                </p>
                <label
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    backgroundColor: "#f37021",
                    color: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Chọn file
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                  />
                </label>
                {selectedFile && (
                  <p
                    style={{
                      marginTop: "12px",
                      fontSize: "13px",
                      color: "#22c55e",
                      fontWeight: "600",
                    }}
                  >
                    ✓ {selectedFile.name}
                  </p>
                )}
                <p
                  style={{ fontSize: "12px", color: "#999", marginTop: "8px" }}
                >
                  Hỗ trợ: PDF, DOC, DOCX (Tối đa 10MB)
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: submitting ? "#ccc" : "#f37021",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {submitting ? (
                <>
                  <Clock size={20} />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Nộp báo cáo
                </>
              )}
            </button>
          </form>
        </div>

        {/* Report History */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            border: "2px solid #f0f0f0",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Calendar size={24} color="#f37021" />
            Lịch sử nộp báo cáo
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  padding: "20px",
                  border: `2px solid ${getStatusColor(report.status)}`,
                  borderRadius: "12px",
                  backgroundColor:
                    report.status === "approved"
                      ? "#f0fdf4"
                      : report.status === "pending"
                      ? "#fff5f0"
                      : "#fef2f2",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
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
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "4px",
                      }}
                    >
                      {report.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#666" }}>
                      Nộp ngày:{" "}
                      {new Date(report.submittedDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      backgroundColor: getStatusColor(report.status),
                      color: "#fff",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {getStatusText(report.status)}
                  </span>
                </div>

                {report.feedback && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(255,255,255,0.8)",
                      borderRadius: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#666",
                        marginBottom: "4px",
                      }}
                    >
                      Nhận xét:
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#333",
                        lineHeight: "1.5",
                      }}
                    >
                      {report.feedback}
                    </p>
                  </div>
                )}

                {report.fileUrl && (
                  <a
                    href={report.fileUrl}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      backgroundColor: "#f37021",
                      color: "#fff",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#d95f1a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f37021";
                    }}
                  >
                    <Download size={16} />
                    Tải xuống
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

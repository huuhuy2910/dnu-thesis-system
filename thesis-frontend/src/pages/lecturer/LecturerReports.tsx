import React, { useState, useEffect, useCallback } from "react";
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
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import type { ApiResponse } from "../../types/api";
import type {
  ProgressSubmission,
  ApiResponseProgressSubmissions,
} from "../../types/progressSubmission";
import type { SubmissionFile } from "../../types/submissionFile";
import type { StudentProfile } from "../../types/studentProfile";
import type { Topic } from "../../types/topic";
import type { TopicTag } from "../../types/tag";
import type { LecturerProfile } from "../../types/lecturer";

const LecturerReports: React.FC = () => {
  const auth = useAuth();
  const [reports, setReports] = useState<ProgressSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<ProgressSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [studentProfiles, setStudentProfiles] = useState<{
    [key: string]: StudentProfile;
  }>({});
  const [topics, setTopics] = useState<{ [key: string]: Topic }>({});
  const [topicTags, setTopicTags] = useState<{ [key: string]: TopicTag[] }>({});
  const [submissionFiles, setSubmissionFiles] = useState<{
    [key: string]: SubmissionFile[];
  }>({});
  const [lecturerComment, setLecturerComment] = useState("");
  const [lecturerState, setLecturerState] = useState("");
  const [feedbackLevel, setFeedbackLevel] = useState("");
  const [lecturerProfile, setLecturerProfile] =
    useState<LecturerProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAdditionalData = useCallback(
    async (submissions: ProgressSubmission[]) => {
      const studentPromises = submissions.map(async (submission) => {
        if (
          submission.studentUserCode &&
          !studentProfiles[submission.studentUserCode]
        ) {
          try {
            const response = await fetchData(
              `/StudentProfiles/get-list?UserCode=${submission.studentUserCode}`
            );
            const data = (response as ApiResponse<StudentProfile[]>).data || [];
            if (data.length > 0) {
              setStudentProfiles((prev) => ({
                ...prev,
                [submission.studentUserCode]: data[0],
              }));
            }
          } catch (err) {
            console.error("Error loading student profile:", err);
          }
        }
      });

      const topicPromises = submissions.map(async (submission) => {
        if (submission.studentUserCode && !topics[submission.studentUserCode]) {
          try {
            const response = await fetchData(
              `/Topics/get-list?ProposerUserCode=${submission.studentUserCode}`
            );
            const data = (response as ApiResponse<Topic[]>).data || [];
            if (data.length > 0) {
              setTopics((prev) => ({
                ...prev,
                [submission.studentUserCode]: data[0],
              }));
            }
          } catch (err) {
            console.error("Error loading topic:", err);
          }
        }
      });

      const tagPromises = submissions.map(async (submission) => {
        const topic = topics[submission.studentUserCode];
        if (topic && !topicTags[topic.topicCode]) {
          try {
            const response = await fetchData(
              `/TopicTags/list?TopicCode=${topic.topicCode}`
            );
            const data = (response as ApiResponse<TopicTag[]>).data || [];
            setTopicTags((prev) => ({ ...prev, [topic.topicCode]: data }));
          } catch (err) {
            console.error("Error loading topic tags:", err);
          }
        }
      });

      const filePromises = submissions.map(async (submission) => {
        if (!submissionFiles[submission.submissionCode]) {
          try {
            const response = await fetchData(
              `/SubmissionFiles/get-list?SubmissionCode=${submission.submissionCode}`
            );
            const data = (response as ApiResponse<SubmissionFile[]>).data || [];
            setSubmissionFiles((prev) => ({
              ...prev,
              [submission.submissionCode]: data,
            }));
          } catch (err) {
            console.error("Error loading submission files:", err);
          }
        }
      });

      await Promise.all([
        ...studentPromises,
        ...topicPromises,
        ...tagPromises,
        ...filePromises,
      ]);
    },
    [studentProfiles, topics, topicTags, submissionFiles]
  );

  const loadLecturerProfile = useCallback(async () => {
    if (!auth.user?.userCode) return;

    try {
      const response = await fetchData(
        `/LecturerProfiles/get-list?UserCode=${auth.user.userCode}`
      );
      const data = (response as ApiResponse<LecturerProfile[]>).data || [];
      if (data.length > 0) {
        setLecturerProfile(data[0]);
      }
    } catch (err) {
      console.error("Error loading lecturer profile:", err);
    }
  }, [auth.user?.userCode]);

  const loadReports = useCallback(async () => {
    if (!lecturerProfile?.lecturerCode) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetchData(
        `/ProgressSubmissions/get-list?LecturerCode=${lecturerProfile.lecturerCode}&Page=1&PageSize=10`
      );
      const data = (response as ApiResponseProgressSubmissions).data || [];
      setReports(data);

      // Load additional data for each report
      await loadAdditionalData(data);
    } catch (err) {
      setError("Không thể tải danh sách báo cáo");
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  }, [lecturerProfile?.lecturerCode, loadAdditionalData]);

  // Load lecturer profile first, then reports
  useEffect(() => {
    loadLecturerProfile();
  }, [loadLecturerProfile]);

  useEffect(() => {
    if (lecturerProfile) {
      loadReports();
    }
  }, [lecturerProfile, loadReports]);

  const filteredReports =
    filterStatus === "all"
      ? reports
      : reports.filter((report) => {
          if (filterStatus === "pending") return !report.lecturerState;
          if (filterStatus === "reviewed")
            return report.lecturerState && report.lecturerState !== "Accepted";
          if (filterStatus === "approved")
            return report.lecturerState === "Accepted";
          if (filterStatus === "rejected")
            return report.lecturerState === "Revision";
          return true;
        });

  const getStatusIcon = (lecturerState: string | null) => {
    if (!lecturerState) return <Clock size={16} color="#F59E0B" />;
    switch (lecturerState) {
      case "Accepted":
        return <CheckCircle size={16} color="#22C55E" />;
      case "Revision":
        return <AlertCircle size={16} color="#EF4444" />;
      case "Pending":
        return <Clock size={16} color="#F59E0B" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (lecturerState: string | null) => {
    if (!lecturerState) return "Chờ duyệt";
    switch (lecturerState) {
      case "Accepted":
        return "Đã duyệt";
      case "Revision":
        return "Yêu cầu sửa đổi";
      case "Pending":
        return "Đang xem xét";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (lecturerState: string | null) => {
    if (!lecturerState) return "#F59E0B";
    switch (lecturerState) {
      case "Accepted":
        return "#22C55E";
      case "Revision":
        return "#EF4444";
      case "Pending":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getReportTypeText = (milestoneCode: string) => {
    if (milestoneCode.includes("MS_TOP")) return "Báo cáo tiến độ";
    return "Báo cáo";
  };

  const handleSubmitComment = async () => {
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      await fetchData(
        `/ProgressSubmissions/update/${selectedReport.submissionID}`,
        {
          method: "PUT",
          body: {
            lecturerComment,
            lecturerState,
            feedbackLevel,
          },
        }
      );

      // Reload reports to show updated data
      await loadReports();
      setSelectedReport(null);
      setLecturerComment("");
      setLecturerState("");
      setFeedbackLevel("");
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Không thể gửi nhận xét");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (fileID: number, fileName: string) => {
    try {
      const response = await fetchData(`/SubmissionFiles/download/${fileID}`);
      // Handle file download - this might need adjustment based on API response
      const blob = new Blob([response as BlobPart], {
        type: "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
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

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            color: "#f37021",
          }}
        >
          <div>Đang tải...</div>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#d32f2f",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
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
              <FileText
                size={24}
                color="#F37021"
                style={{ marginBottom: "8px" }}
              />
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
              <div style={{ fontSize: "12px", color: "#666" }}>
                Tổng báo cáo
              </div>
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
              <Clock
                size={24}
                color="#F59E0B"
                style={{ marginBottom: "8px" }}
              />
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#F59E0B",
                  marginBottom: "4px",
                }}
              >
                {reports.filter((r) => !r.lecturerState).length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Chờ nhận xét
              </div>
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
                {reports.filter((r) => r.lecturerState === "Accepted").length}
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
                {reports.filter((r) => r.lecturerState === "Revision").length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Yêu cầu sửa đổi
              </div>
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
              <option value="reviewed">Đang xem xét</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Yêu cầu sửa đổi</option>
            </select>
          </div>

          {/* Reports List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {filteredReports.map((report) => {
              const studentProfile = studentProfiles[report.studentUserCode];
              const topic = topics[report.studentUserCode];
              const files = submissionFiles[report.submissionCode] || [];

              return (
                <div
                  key={report.submissionID}
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
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.05)";
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
                          {report.reportTitle || "Báo cáo chưa có tiêu đề"}
                        </h3>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            background:
                              getStatusColor(report.lecturerState) + "20",
                            color: getStatusColor(report.lecturerState),
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {getStatusIcon(report.lecturerState)}
                          {getStatusText(report.lecturerState)}
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
                          {getReportTypeText(report.milestoneCode)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
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
                            Sinh viên:{" "}
                            <strong>
                              {studentProfile?.fullName ||
                                report.studentUserCode}
                            </strong>{" "}
                            (
                            {studentProfile?.studentCode ||
                              report.studentUserCode}
                            )
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
                            Đề tài: {topic?.title || "N/A"}
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
                            {new Date(report.submittedAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Student Report Description */}
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
                            Mô tả báo cáo của sinh viên
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#1a1a1a",
                            margin: 0,
                          }}
                        >
                          {report.reportDescription || "Chưa có mô tả"}
                        </p>
                      </div>

                      {/* Lecturer Comments */}
                      {report.lecturerComment && (
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
                            {report.lecturerComment}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#92400E",
                              margin: "4px 0 0 0",
                              opacity: 0.8,
                            }}
                          >
                            Cấp độ phản hồi:{" "}
                            {report.feedbackLevel || "Chưa đánh giá"}
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
                      {files.map((file) => (
                        <button
                          key={file.fileID}
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
                          onClick={() =>
                            handleDownloadFile(file.fileID, file.fileName)
                          }
                        >
                          <Download size={14} />
                          Tải {file.fileName}
                        </button>
                      ))}

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
                    </div>
                  </div>
                </div>
              );
            })}
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
                  maxWidth: "700px",
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
                      Tiêu đề báo cáo
                    </label>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#1a1a1a",
                        margin: "4px 0",
                      }}
                    >
                      {selectedReport.reportTitle || "Báo cáo chưa có tiêu đề"}
                    </p>
                  </div>{" "}
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
                        {studentProfiles[selectedReport.studentUserCode]
                          ?.fullName || selectedReport.studentUserCode}{" "}
                        (
                        {studentProfiles[selectedReport.studentUserCode]
                          ?.studentCode || selectedReport.studentUserCode}
                        )
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
                        {getReportTypeText(selectedReport.milestoneCode)}
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
                      {topics[selectedReport.studentUserCode]?.title || "N/A"}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        margin: "2px 0",
                      }}
                    >
                      Mã đề tài:{" "}
                      {topics[selectedReport.studentUserCode]?.topicCode ||
                        "N/A"}
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
                        {new Date(
                          selectedReport.submittedAt
                        ).toLocaleDateString("vi-VN")}
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
                          background:
                            getStatusColor(selectedReport.lecturerState) + "20",
                          color: getStatusColor(selectedReport.lecturerState),
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          marginTop: "4px",
                        }}
                      >
                        {getStatusText(selectedReport.lecturerState)}
                      </span>
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
                      Mô tả báo cáo của sinh viên
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
                      {selectedReport.reportDescription || "Chưa có mô tả"}
                    </p>
                  </div>
                  {selectedReport.lecturerComment && (
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
                        {selectedReport.lecturerComment}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#92400E",
                          margin: "4px 0 0 0",
                        }}
                      >
                        Cấp độ phản hồi:{" "}
                        {selectedReport.feedbackLevel || "Chưa đánh giá"}
                      </p>
                    </div>
                  )}
                  {/* Lecturer Comment Form */}
                  {!selectedReport.lecturerState && (
                    <div
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        padding: "16px",
                        background: "#F9FAFB",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          marginBottom: "16px",
                        }}
                      >
                        Nhận xét báo cáo
                      </h3>

                      <div style={{ display: "grid", gap: "12px" }}>
                        <div>
                          <label
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#666",
                              textTransform: "uppercase",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Nhận xét
                          </label>
                          <textarea
                            value={lecturerComment}
                            onChange={(e) => setLecturerComment(e.target.value)}
                            placeholder="Nhập nhận xét của bạn..."
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #D1D5DB",
                              borderRadius: "4px",
                              fontSize: "14px",
                              minHeight: "80px",
                              resize: "vertical",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#666",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Trạng thái
                            </label>
                            <select
                              value={lecturerState}
                              onChange={(e) => setLecturerState(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #D1D5DB",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">Chọn trạng thái</option>
                              <option value="Accepted">Duyệt</option>
                              <option value="Revision">Yêu cầu sửa đổi</option>
                              <option value="Pending">Đang xem xét</option>
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#666",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Cấp độ phản hồi
                            </label>
                            <select
                              value={feedbackLevel}
                              onChange={(e) => setFeedbackLevel(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #D1D5DB",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="">Chọn cấp độ</option>
                              <option value="High">Cao</option>
                              <option value="Normal">Bình thường</option>
                              <option value="Moderate">Trung bình</option>
                              <option value="Low">Thấp</option>
                            </select>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={handleSubmitComment}
                            disabled={submitting || !lecturerState}
                            style={{
                              padding: "8px 16px",
                              background: "#F37021",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: "600",
                              cursor: submitting ? "not-allowed" : "pointer",
                              opacity: submitting ? 0.6 : 1,
                            }}
                          >
                            {submitting ? "Đang gửi..." : "Gửi nhận xét"}
                          </button>
                        </div>
                      </div>
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
                    onClick={() => {
                      setSelectedReport(null);
                      setLecturerComment("");
                      setLecturerState("");
                      setFeedbackLevel("");
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LecturerReports;

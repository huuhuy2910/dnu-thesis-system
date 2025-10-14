import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  User,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import type { Topic } from "../../types/topic";
import type { StudentProfile } from "../../types/studentProfile";
import type { ProgressMilestone } from "../../types/progressMilestone";
import { useAuth } from "../../hooks/useAuth";

interface TopicDisplay {
  topicID: number;
  topicCode: string;
  title: string;
  description: string;
  studentCode: string;
  studentName: string;
  submissionDate: string;
  status: "Chờ duyệt" | "Đã duyệt" | "Từ chối" | "Cần sửa đổi";
  category: string;
  comments?: string;
  studentProfile?: StudentProfile;
  supervisorLecturerProfileID?: number | null;
  supervisorLecturerCode?: string | null;
}

const LecturerTopicReview: React.FC = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{
    isOpen: boolean;
    action: "reject" | "revision" | null;
    topicID: number | null;
    topicTitle: string;
  }>({
    isOpen: false,
    action: null,
    topicID: null,
    topicTitle: "",
  });
  const [commentText, setCommentText] = useState("");
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    topic: TopicDisplay | null;
  }>({
    isOpen: false,
    topic: null,
  });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    action: "approve" | "reject" | "revision" | null;
    topicTitle: string;
  }>({
    isOpen: false,
    action: null,
    topicTitle: "",
  });

  // Fetch topics for the lecturer
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user?.userCode) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch topics list
        const topicsResponse = await fetchData<{ data: Topic[] }>(
          `/Topics/get-list?SupervisorUserCode=${user.userCode}`
        );

        // Transform topics to display format
        const displayTopics: TopicDisplay[] = await Promise.all(
          topicsResponse.data.map(async (topic) => {
            // Fetch student profile for each topic
            let studentProfile: StudentProfile | undefined;
            try {
              const studentResponse = await fetchData<{
                data: StudentProfile[];
              }>(
                `/StudentProfiles/get-list?StudentCode=${topic.proposerStudentCode}`
              );
              studentProfile = studentResponse.data[0];
            } catch (err) {
              console.warn(
                `Failed to fetch student profile for ${topic.proposerStudentCode}`,
                err
              );
            }

            return {
              topicID: topic.topicID,
              topicCode: topic.topicCode,
              title: topic.title,
              description: topic.summary, // Using summary as description
              studentCode: topic.proposerStudentCode || "",
              studentName: studentProfile?.fullName || "Unknown",
              submissionDate: topic.createdAt,
              status: mapApiStatusToDisplay(topic.status),
              category:
                topic.type === "CATALOG" ? "Đề tài catalog" : "Đề tài tự chọn",
              comments: "", // Will be populated from API updates
              studentProfile,
              supervisorLecturerProfileID: topic.supervisorLecturerProfileID,
              supervisorLecturerCode: topic.supervisorLecturerCode,
            };
          })
        );

        setTopics(displayTopics);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        setError("Không thể tải danh sách đề tài. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [user?.userCode]);

  // Map API status to display status
  const mapApiStatusToDisplay = (apiStatus: string): TopicDisplay["status"] => {
    const status = apiStatus.toLowerCase();
    switch (status) {
      case "approved":
      case "đã duyệt":
        return "Đã duyệt";
      case "rejected":
      case "từ chối":
        return "Từ chối";
      case "revision":
      case "cần sửa đổi":
        return "Cần sửa đổi";
      case "pending":
      case "đang chờ":
      case "chờ duyệt":
      default:
        return "Chờ duyệt";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Đã duyệt":
        return <CheckCircle size={16} color="#22C55E" />;
      case "Chờ duyệt":
        return <Clock size={16} color="#F59E0B" />;
      case "Từ chối":
        return <AlertCircle size={16} color="#EF4444" />;
      case "Cần sửa đổi":
        return <Edit size={16} color="#8B5CF6" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Đã duyệt":
        return "Đã duyệt";
      case "Chờ duyệt":
        return "Chờ duyệt";
      case "Từ chối":
        return "Từ chối";
      case "Cần sửa đổi":
        return "Cần sửa đổi";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã duyệt":
        return "#22C55E";
      case "Chờ duyệt":
        return "#F59E0B";
      case "Từ chối":
        return "#EF4444";
      case "Cần sửa đổi":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const handleApprove = async (topicID: number) => {
    try {
      setUpdatingStatus(`approve-${topicID}`);

      // First, approve the topic
      await fetchData(`/Topics/update/${topicID}`, {
        method: "PUT",
        body: {
          status: "Đã duyệt",
          lecturerComment: "",
        },
      });

      // Get the topic details to get topicCode
      const topic = topics.find((t) => t.topicID === topicID);
      if (!topic || !topic.supervisorLecturerCode) {
        throw new Error("Missing topic or lecturer information");
      }

      // Create TopicLecturer association
      try {
        // First get-create to ensure data structure (GET request)
        await fetchData(`/TopicLecturers/get-create`);

        // Then create the actual association
        await fetchData(`/TopicLecturers/create`, {
          method: "POST",
          body: {
            topicID: topicID,
            topicCode: topic.topicCode,
            lecturerProfileID: topic.supervisorLecturerProfileID || 0,
            lecturerCode: topic.supervisorLecturerCode,
            isPrimary: true,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (lecturerErr) {
        console.warn(
          "Failed to create topic-lecturer association:",
          lecturerErr
        );
        // Continue with approval even if lecturer association fails
      }

      // Update progress milestone
      try {
        // First get current milestone data
        const currentMilestoneResponse = await fetchData<{
          data: ProgressMilestone;
        }>(`/ProgressMilestones/get-update/${topicID}`);
        const currentMilestone = currentMilestoneResponse.data;

        // Update only the specified fields
        const updatedMilestone = {
          ...currentMilestone,
          milestoneTemplateCode: "MS_PROG1",
          ordinal: 2,
          state: "Đang thực hiện",
          completedAt1: new Date().toISOString(),
        };

        // Update the milestone by topic ID (PUT request)
        await fetchData(`/ProgressMilestones/update/${topicID}`, {
          method: "PUT",
          body: updatedMilestone,
        });
      } catch (progressErr) {
        console.warn("Failed to update progress milestone:", progressErr);
        // Continue with approval even if progress update fails
      }

      // Update local state
      setTopics(
        topics.map((t) =>
          t.topicID === topicID ? { ...t, status: "Đã duyệt" as const } : t
        )
      );

      showSuccessModal(
        "approve",
        topics.find((t) => t.topicID === topicID)?.title || ""
      );
    } catch (err) {
      console.error("Failed to approve topic:", err);
      alert("Không thể duyệt đề tài. Vui lòng thử lại.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReject = async (topicID: number, comment: string) => {
    try {
      setUpdatingStatus(`reject-${topicID}`);

      await fetchData(`/Topics/update/${topicID}`, {
        method: "PUT",
        body: {
          status: "Từ chối",
          lecturerComment: comment,
        },
      });

      // Update local state
      setTopics(
        topics.map((topic) =>
          topic.topicID === topicID
            ? { ...topic, status: "Từ chối" as const, comments: comment }
            : topic
        )
      );
      showSuccessModal(
        "reject",
        topics.find((t) => t.topicID === topicID)?.title || ""
      );
    } catch (err) {
      console.error("Failed to reject topic:", err);
      alert("Không thể từ chối đề tài. Vui lòng thử lại.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRequestRevision = async (topicID: number, comment: string) => {
    try {
      setUpdatingStatus(`revision-${topicID}`);

      await fetchData(`/Topics/update/${topicID}`, {
        method: "PUT",
        body: {
          status: "Cần sửa đổi",
          lecturerComment: comment,
        },
      });

      // Update local state
      setTopics(
        topics.map((topic) =>
          topic.topicID === topicID
            ? { ...topic, status: "Cần sửa đổi" as const, comments: comment }
            : topic
        )
      );
      showSuccessModal(
        "revision",
        topics.find((t) => t.topicID === topicID)?.title || ""
      );
    } catch (err) {
      console.error("Failed to request revision:", err);
      alert("Không thể yêu cầu sửa đổi đề tài. Vui lòng thử lại.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openCommentModal = (
    action: "reject" | "revision",
    topicID: number,
    topicTitle: string
  ) => {
    setCommentModal({
      isOpen: true,
      action,
      topicID,
      topicTitle,
    });
    setCommentText("");
  };

  const closeCommentModal = () => {
    setCommentModal({
      isOpen: false,
      action: null,
      topicID: null,
      topicTitle: "",
    });
    setCommentText("");
  };

  const handleCommentSubmit = async () => {
    if (!commentModal.topicID || !commentModal.action || !commentText.trim())
      return;

    try {
      if (commentModal.action === "reject") {
        await handleReject(commentModal.topicID, commentText.trim());
      } else if (commentModal.action === "revision") {
        await handleRequestRevision(commentModal.topicID, commentText.trim());
      }
      closeCommentModal();
    } catch {
      // Error handling is done in the individual functions
    }
  };

  const openConfirmationModal = (topic: TopicDisplay) => {
    setConfirmationModal({
      isOpen: true,
      topic,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      topic: null,
    });
  };

  const handleConfirmApprove = async () => {
    if (!confirmationModal.topic) return;

    try {
      await handleApprove(confirmationModal.topic.topicID);
      closeConfirmationModal();
      showSuccessModal("approve", confirmationModal.topic.title);
    } catch {
      // Error handling is done in handleApprove
    }
  };

  const showSuccessModal = (
    action: "approve" | "reject" | "revision",
    topicTitle: string
  ) => {
    setSuccessModal({
      isOpen: true,
      action,
      topicTitle,
    });
  };

  const closeSuccessModal = () => {
    setSuccessModal({
      isOpen: false,
      action: null,
      topicTitle: "",
    });
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
          Duyệt đề tài
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem và duyệt các đề tài luận văn của sinh viên
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            border: "1px solid #EF4444",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Loader2
            size={32}
            color="#F37021"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ marginTop: "16px", color: "#666" }}>
            Đang tải danh sách đề tài...
          </p>
        </div>
      ) : (
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
              <BookOpen
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
                {topics.filter((t) => t.status === "Đã duyệt").length}
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
                {topics.filter((t) => t.status === "Chờ duyệt").length}
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
                {topics.filter((t) => t.status === "Từ chối").length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>Từ chối</div>
            </div>
          </div>

          {/* Topics List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {topics
              .sort((a, b) => {
                // Ưu tiên hiển thị "Chờ duyệt" trước
                if (a.status === "Chờ duyệt" && b.status !== "Chờ duyệt")
                  return -1;
                if (a.status !== "Chờ duyệt" && b.status === "Chờ duyệt")
                  return 1;
                // Các status khác giữ nguyên thứ tự
                return 0;
              })
              .map((topic) => (
                <div
                  key={topic.topicID}
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

                      {/* Student Details */}
                      {topic.studentProfile && (
                        <div
                          style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "8px",
                            padding: "16px",
                            marginTop: "16px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#002855",
                              marginBottom: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <User size={16} />
                            Thông tin chi tiết sinh viên
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  fontWeight: "600",
                                }}
                              >
                                Email:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.studentProfile.studentEmail}
                              </p>
                            </div>
                            <div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  fontWeight: "600",
                                }}
                              >
                                Số điện thoại:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.studentProfile.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  fontWeight: "600",
                                }}
                              >
                                GPA:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.studentProfile.gpa}
                              </p>
                            </div>
                            <div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  fontWeight: "600",
                                }}
                              >
                                Học lực:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.studentProfile.academicStanding}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

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
                      {topic.status === "Chờ duyệt" && (
                        <>
                          <button
                            disabled={
                              updatingStatus === `approve-${topic.topicID}`
                            }
                            style={{
                              padding: "8px 16px",
                              background:
                                updatingStatus === `approve-${topic.topicID}`
                                  ? "#9CA3AF"
                                  : "#22C55E",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === `approve-${topic.topicID}`
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                            onMouseEnter={(e) => {
                              if (
                                updatingStatus !== `approve-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#16A34A";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                updatingStatus !== `approve-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#22C55E";
                              }
                            }}
                            onClick={() => openConfirmationModal(topic)}
                          >
                            {updatingStatus === `approve-${topic.topicID}` ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Duyệt
                          </button>

                          <button
                            disabled={
                              updatingStatus === `reject-${topic.topicID}`
                            }
                            style={{
                              padding: "8px 16px",
                              background:
                                updatingStatus === `reject-${topic.topicID}`
                                  ? "#9CA3AF"
                                  : "#EF4444",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === `reject-${topic.topicID}`
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                            onMouseEnter={(e) => {
                              if (
                                updatingStatus !== `reject-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#DC2626";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                updatingStatus !== `reject-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#EF4444";
                              }
                            }}
                            onClick={() => {
                              openCommentModal(
                                "reject",
                                topic.topicID,
                                topic.title
                              );
                            }}
                          >
                            {updatingStatus === `reject-${topic.topicID}` ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <AlertCircle size={14} />
                            )}
                            Từ chối
                          </button>

                          <button
                            disabled={
                              updatingStatus === `revision-${topic.topicID}`
                            }
                            style={{
                              padding: "8px 16px",
                              background:
                                updatingStatus === `revision-${topic.topicID}`
                                  ? "#9CA3AF"
                                  : "#8B5CF6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === `revision-${topic.topicID}`
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                            onMouseEnter={(e) => {
                              if (
                                updatingStatus !== `revision-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#7C3AED";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                updatingStatus !== `revision-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#8B5CF6";
                              }
                            }}
                            onClick={() => {
                              openCommentModal(
                                "revision",
                                topic.topicID,
                                topic.title
                              );
                            }}
                          >
                            {updatingStatus === `revision-${topic.topicID}` ? (
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <Edit size={14} />
                            )}
                            Yêu cầu sửa đổi
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Comment Modal */}
      {commentModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeCommentModal}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {commentModal.action === "reject" ? (
                <AlertCircle size={20} color="#EF4444" />
              ) : (
                <Edit size={20} color="#8B5CF6" />
              )}
              {commentModal.action === "reject"
                ? "Từ chối đề tài"
                : "Yêu cầu sửa đổi"}
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "8px",
                }}
              >
                <strong>Đề tài:</strong> {commentModal.topicTitle}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                {commentModal.action === "reject"
                  ? "Lý do từ chối:"
                  : "Yêu cầu sửa đổi:"}
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  commentModal.action === "reject"
                    ? "Nhập lý do từ chối đề tài..."
                    : "Nhập yêu cầu sửa đổi cho sinh viên..."
                }
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#F37021";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#D1D5DB";
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeCommentModal}
                style={{
                  padding: "8px 16px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim() || updatingStatus !== null}
                style={{
                  padding: "8px 16px",
                  background:
                    commentText.trim() && updatingStatus === null
                      ? commentModal.action === "reject"
                        ? "#EF4444"
                        : "#8B5CF6"
                      : "#9CA3AF",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    commentText.trim() && updatingStatus === null
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  if (commentText.trim() && updatingStatus === null) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {updatingStatus ? (
                  <>
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Đang xử lý...
                  </>
                ) : commentModal.action === "reject" ? (
                  "Từ chối"
                ) : (
                  "Yêu cầu sửa đổi"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && confirmationModal.topic && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeConfirmationModal}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={24} color="#22C55E" />
              Xác nhận duyệt đề tài
            </h3>

            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #22C55E",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "8px",
                  }}
                >
                  {confirmationModal.topic.title}
                </h4>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {confirmationModal.topic.description}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Sinh viên
                  </span>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                      fontWeight: "500",
                    }}
                  >
                    {confirmationModal.topic.studentName}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      margin: 0,
                    }}
                  >
                    {confirmationModal.topic.studentCode}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Danh mục
                  </span>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                      fontWeight: "500",
                    }}
                  >
                    {confirmationModal.topic.category}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    Ngày nộp
                  </span>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1a1a1a",
                      margin: "4px 0",
                      fontWeight: "500",
                    }}
                  >
                    {new Date(
                      confirmationModal.topic.submissionDate
                    ).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              {confirmationModal.topic.studentProfile && (
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px",
                    marginTop: "16px",
                  }}
                >
                  <h5
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#002855",
                      marginBottom: "12px",
                    }}
                  >
                    Thông tin sinh viên
                  </h5>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          fontWeight: "600",
                        }}
                      >
                        Email:
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#1a1a1a",
                          margin: "2px 0",
                        }}
                      >
                        {confirmationModal.topic.studentProfile.studentEmail}
                      </p>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          fontWeight: "600",
                        }}
                      >
                        GPA:
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#1a1a1a",
                          margin: "2px 0",
                        }}
                      >
                        {confirmationModal.topic.studentProfile.gpa}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
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
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#92400E",
                  }}
                >
                  Lưu ý quan trọng
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#92400E",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Khi duyệt đề tài, bạn sẽ trở thành giảng viên hướng dẫn chính
                của sinh viên này và tiến độ luận văn sẽ được cập nhật tự động.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeConfirmationModal}
                style={{
                  padding: "10px 20px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={updatingStatus !== null}
                style={{
                  padding: "10px 20px",
                  background: updatingStatus === null ? "#22C55E" : "#9CA3AF",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: updatingStatus === null ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  if (updatingStatus === null) {
                    e.currentTarget.style.background = "#16A34A";
                  }
                }}
                onMouseLeave={(e) => {
                  if (updatingStatus === null) {
                    e.currentTarget.style.background = "#22C55E";
                  }
                }}
              >
                {updatingStatus ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Xác nhận duyệt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeSuccessModal}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#F0FDF4",
                border: "4px solid #22C55E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle size={32} color="#22C55E" />
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "8px",
              }}
            >
              {successModal.action === "approve" && "Duyệt đề tài thành công"}
              {successModal.action === "reject" && "Từ chối đề tài thành công"}
              {successModal.action === "revision" &&
                "Yêu cầu sửa đổi thành công"}
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#666",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              Đề tài <strong>"{successModal.topicTitle}"</strong> đã được{" "}
              {successModal.action === "approve" && "duyệt"}
              {successModal.action === "reject" && "từ chối"}
              {successModal.action === "revision" && "yêu cầu sửa đổi"} thành
              công.
            </p>

            <button
              onClick={closeSuccessModal}
              style={{
                padding: "10px 24px",
                background: "#22C55E",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
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
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerTopicReview;

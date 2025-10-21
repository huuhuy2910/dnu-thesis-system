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
  Mail,
  Filter,
} from "lucide-react";
import { fetchData, getAvatarUrl } from "../../api/fetchData";
import type { Topic } from "../../types/topic";
import type { StudentProfile } from "../../types/studentProfile";
import type { LecturerProfile } from "../../types/lecturer-profile";
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
  lecturerProfile?: LecturerProfile | null;
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

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    topic: TopicDisplay | null;
  }>({
    isOpen: false,
    topic: null,
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch topics for the lecturer
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user?.userCode) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch topics list with pagination to get all records
        let allTopics: Topic[] = [];
        let pageNumber = 1;
        const pageSize = 50; // Large page size to get all records

        while (true) {
          const topicsResponse = await fetchData<{
            data: Topic[];
            totalCount: number;
          }>(`/Topics/get-list?pageNumber=${pageNumber}&pageSize=${pageSize}`);

          allTopics = [...allTopics, ...topicsResponse.data];

          // Check if we have all records
          if (
            allTopics.length >= topicsResponse.totalCount ||
            topicsResponse.data.length < pageSize
          ) {
            break;
          }

          pageNumber++;
        }

        // Transform topics to display format
        const displayTopics: TopicDisplay[] = await Promise.all(
          allTopics.map(async (topic) => {
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

            // Fetch lecturer profile for each topic if supervisor exists
            let lecturerProfile: LecturerProfile | null = null;
            if (topic.supervisorLecturerCode) {
              try {
                const lecturerResponse = await fetchData<{
                  data: LecturerProfile;
                }>(
                  `/LecturerProfiles/get-detail/${topic.supervisorLecturerCode}`
                );
                lecturerProfile = lecturerResponse.data;
              } catch (err) {
                console.warn(
                  `Failed to fetch lecturer profile for ${topic.supervisorLecturerCode}`,
                  err
                );
              }
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
              comments: topic.lecturerComment || "", // Include lecturer comments from API
              studentProfile,
              supervisorLecturerProfileID: topic.supervisorLecturerProfileID,
              supervisorLecturerCode: topic.supervisorLecturerCode,
              lecturerProfile,
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
        return <Edit size={16} color="#F59E0B" />;
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
        return "#F59E0B";
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

  const openDetailModal = async (topic: TopicDisplay) => {
    setDetailModal({
      isOpen: true,
      topic,
    });
  };

  const closeDetailModal = () => {
    setDetailModal({
      isOpen: false,
      topic: null,
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
          <BookOpen size={32} color="#F59E0B" />
          Duyệt đề tài
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem và duyệt các đề tài luận văn của sinh viên
        </p>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Filter size={16} />
            Lọc theo trạng thái:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              background: "white",
              cursor: "pointer",
              minWidth: "160px",
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Cần sửa đổi">Cần sửa đổi</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>
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
            color="#F59E0B"
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
                background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
                border: "1px solid #F59E0B",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <BookOpen
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
                {topics.filter((t) => t.status === "Cần sửa đổi").length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>Cần sửa đổi</div>
            </div>
          </div>

          {/* Topics List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {topics
              .filter((topic) =>
                statusFilter === "all" ? true : topic.status === statusFilter
              )
              .sort((a, b) => {
                // Thứ tự ưu tiên: Chờ duyệt > Cần sửa đổi > Đã duyệt > Từ chối
                const priorityOrder = {
                  "Chờ duyệt": 1,
                  "Cần sửa đổi": 2,
                  "Đã duyệt": 3,
                  "Từ chối": 4,
                };

                const aPriority =
                  priorityOrder[a.status as keyof typeof priorityOrder] || 5;
                const bPriority =
                  priorityOrder[b.status as keyof typeof priorityOrder] || 5;

                return aPriority - bPriority;
              })
              .map((topic) => (
                <div
                  key={topic.topicID}
                  style={{
                    background: "white",
                    border:
                      topic.status === "Đã duyệt"
                        ? "2px solid #22C55E"
                        : topic.status === "Từ chối" ||
                          topic.status === "Cần sửa đổi"
                        ? `2px solid ${
                            topic.status === "Từ chối" ? "#EF4444" : "#F59E0B"
                          }`
                        : "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow:
                      topic.status === "Đã duyệt" ||
                      topic.status === "Từ chối" ||
                      topic.status === "Cần sửa đổi"
                        ? "0 4px 16px rgba(0,0,0,0.1)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      topic.status === "Đã duyệt" ||
                      topic.status === "Từ chối" ||
                      topic.status === "Cần sửa đổi"
                        ? "0 8px 32px rgba(0,0,0,0.15)"
                        : "0 8px 24px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      topic.status === "Đã duyệt" ||
                      topic.status === "Từ chối" ||
                      topic.status === "Cần sửa đổi"
                        ? "0 4px 16px rgba(0,0,0,0.1)"
                        : "0 2px 8px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* Status indicator for all processed topics */}
                  {(topic.status === "Đã duyệt" ||
                    topic.status === "Từ chối" ||
                    topic.status === "Cần sửa đổi") && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background:
                          topic.status === "Đã duyệt"
                            ? "#22C55E"
                            : topic.status === "Từ chối"
                            ? "#EF4444"
                            : "#F59E0B",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        zIndex: 2,
                      }}
                    >
                      {topic.status === "Đã duyệt" ? (
                        <CheckCircle size={12} />
                      ) : topic.status === "Từ chối" ? (
                        <AlertCircle size={12} />
                      ) : (
                        <Edit size={12} />
                      )}
                      {topic.status === "Đã duyệt"
                        ? "Đã duyệt"
                        : topic.status === "Từ chối"
                        ? "Từ chối"
                        : "Cần sửa"}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "20px",
                      alignItems: "start",
                      flex: 1,
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
                        {topic.status === "Chờ duyệt" && (
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
                        )}
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
                              gridTemplateColumns: "1fr 1fr",
                              gap: "16px",
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

                      {/* Lecturer Details */}
                      {topic.lecturerProfile && (
                        <div
                          style={{
                            background: "#F0F9FF",
                            border: "1px solid #0EA5E9",
                            borderRadius: "8px",
                            padding: "16px",
                            marginTop: "16px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#0C4A6E",
                              marginBottom: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <User size={16} />
                            Thông tin giảng viên hướng dẫn
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "16px",
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
                                Tên giảng viên:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.lecturerProfile.fullName}
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
                                Email:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.lecturerProfile.email}
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
                                {topic.lecturerProfile.phoneNumber ||
                                  "Chưa cập nhật"}
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
                                Học vị:
                              </span>
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#1a1a1a",
                                  margin: "2px 0",
                                }}
                              >
                                {topic.lecturerProfile.degree ||
                                  "Chưa cập nhật"}
                              </p>
                            </div>
                          </div>
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
                                  : "#F59E0B",
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
                                e.currentTarget.style.background = "#D97706";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                updatingStatus !== `revision-${topic.topicID}`
                              ) {
                                e.currentTarget.style.background = "#F59E0B";
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

                      {/* Status Information for Processed Topics */}
                      {topic.status !== "Chờ duyệt" && (
                        <div
                          style={{
                            padding: "20px",
                            borderRadius: "12px",
                            backgroundColor:
                              topic.status === "Đã duyệt"
                                ? "#F0FDF4"
                                : topic.status === "Từ chối"
                                ? "#FEF2F2"
                                : "#FFFBEB",
                            border: `2px solid ${
                              topic.status === "Đã duyệt"
                                ? "#22C55E"
                                : topic.status === "Từ chối"
                                ? "#EF4444"
                                : "#F59E0B"
                            }`,
                            minWidth: "320px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Status Header */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              paddingBottom: "12px",
                              borderBottom: `1px solid ${
                                topic.status === "Đã duyệt"
                                  ? "#DCFCE7"
                                  : topic.status === "Từ chối"
                                  ? "#FEE2E2"
                                  : "#FEF3C7"
                              }`,
                            }}
                          >
                            {topic.status === "Đã duyệt" && (
                              <CheckCircle size={24} color="#22C55E" />
                            )}
                            {topic.status === "Từ chối" && (
                              <AlertCircle size={24} color="#EF4444" />
                            )}
                            {topic.status === "Cần sửa đổi" && (
                              <Edit size={24} color="#F59E0B" />
                            )}
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "700",
                                color:
                                  topic.status === "Đã duyệt"
                                    ? "#16A34A"
                                    : topic.status === "Từ chối"
                                    ? "#DC2626"
                                    : "#F59E0B",
                              }}
                            >
                              {topic.status}
                            </span>
                          </div>

                          {/* Status Details */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {topic.status === "Đã duyệt" && <></>}
                          </div>

                          {/* Comments */}
                          <div
                            style={{
                              background:
                                topic.status === "Đã duyệt"
                                  ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
                                  : topic.status === "Từ chối"
                                  ? "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)"
                                  : "linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 100%)",
                              border:
                                topic.status === "Đã duyệt"
                                  ? "1px solid #BBF7D0"
                                  : topic.status === "Từ chối"
                                  ? "1px solid #FECACA"
                                  : "1px solid #FDE68A",
                              borderRadius: "12px",
                              padding: "16px",
                              marginTop: "16px",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            {/* Background decoration */}
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "60px",
                                height: "60px",
                                background:
                                  topic.status === "Đã duyệt"
                                    ? "rgba(34, 197, 94, 0.1)"
                                    : topic.status === "Từ chối"
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : "rgba(245, 158, 11, 0.1)",
                                borderRadius: "50%",
                                transform: "translate(20px, -20px)",
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {/* Status Icon */}
                              <div
                                style={{
                                  background:
                                    topic.status === "Đã duyệt"
                                      ? "#22C55E"
                                      : topic.status === "Từ chối"
                                      ? "#EF4444"
                                      : "#F59E0B",
                                  borderRadius: "8px",
                                  padding: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {topic.status === "Đã duyệt" ? (
                                  <CheckCircle size={16} color="white" />
                                ) : topic.status === "Từ chối" ? (
                                  <AlertCircle size={16} color="white" />
                                ) : (
                                  <Edit size={16} color="white" />
                                )}
                              </div>

                              {/* Comment Content */}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <h4
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "600",
                                      color:
                                        topic.status === "Đã duyệt"
                                          ? "#16A34A"
                                          : topic.status === "Từ chối"
                                          ? "#DC2626"
                                          : "#92400E",
                                      margin: 0,
                                    }}
                                  >
                                    {topic.status === "Đã duyệt"
                                      ? "Đề tài đã được duyệt"
                                      : topic.status === "Từ chối"
                                      ? "Đề tài đã bị từ chối"
                                      : "Yêu cầu sửa đổi đề tài"}
                                  </h4>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#666",
                                      background: "rgba(255,255,255,0.8)",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {topic.status}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    fontSize: "14px",
                                    color:
                                      topic.status === "Đã duyệt"
                                        ? "#15803D"
                                        : topic.status === "Từ chối"
                                        ? "#7F1D1D"
                                        : "#78350F",
                                    lineHeight: "1.5",
                                    background: "rgba(255,255,255,0.6)",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border:
                                      topic.status === "Đã duyệt"
                                        ? "1px solid rgba(34, 197, 94, 0.2)"
                                        : topic.status === "Từ chối"
                                        ? "1px solid rgba(239, 68, 68, 0.2)"
                                        : "1px solid rgba(245, 158, 11, 0.2)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      color:
                                        topic.status === "Đã duyệt"
                                          ? "#16A34A"
                                          : topic.status === "Từ chối"
                                          ? "#DC2626"
                                          : "#92400E",
                                      marginBottom: "6px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {topic.status === "Đã duyệt"
                                      ? "Thông tin duyệt đề tài:"
                                      : topic.status === "Từ chối"
                                      ? "Lý do từ chối:"
                                      : "Chi tiết yêu cầu:"}
                                  </div>
                                  {topic.status === "Đã duyệt"
                                    ? "Đề tài này đã được duyệt thành công."
                                    : topic.comments || "Không có bình luận"}
                                </div>

                                {/* Additional info */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    marginTop: "12px",
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Clock size={12} />
                                    <span>
                                      Xử lý ngày:{" "}
                                      {new Date().toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                  {topic.supervisorLecturerCode && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <User size={12} />
                                      <span>
                                        Người xử lý:{" "}
                                        {topic.supervisorLecturerCode}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Spacer to push buttons to bottom */}
                          <div style={{ flex: 1 }}></div>

                          {/* Action buttons for approved topics - aligned to bottom */}
                          {topic.status === "Đã duyệt" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                marginTop: "auto",
                              }}
                            >
                              <button
                                style={{
                                  padding: "10px 16px",
                                  background: "#22C55E",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#16A34A";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#22C55E";
                                }}
                              >
                                <FileText size={14} />
                                Xem tiến độ
                              </button>

                              <button
                                style={{
                                  padding: "10px 16px",
                                  background: "#3B82F6",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#2563EB";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#3B82F6";
                                }}
                              >
                                <User size={14} />
                                Liên hệ sinh viên
                              </button>
                            </div>
                          )}

                          {/* Action buttons for rejected/revision topics */}
                          {(topic.status === "Từ chối" ||
                            topic.status === "Cần sửa đổi") && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                marginTop: "auto",
                              }}
                            >
                              <button
                                style={{
                                  padding: "10px 16px",
                                  background:
                                    topic.status === "Từ chối"
                                      ? "#EF4444"
                                      : "#F59E0B",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    topic.status === "Từ chối"
                                      ? "#DC2626"
                                      : "#D97706";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    topic.status === "Từ chối"
                                      ? "#EF4444"
                                      : "#F59E0B";
                                }}
                                onClick={() => openDetailModal(topic)}
                              >
                                <FileText size={14} />
                                Xem chi tiết
                              </button>

                              <button
                                style={{
                                  padding: "10px 16px",
                                  background: "#6B7280",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#4B5563";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#6B7280";
                                }}
                              >
                                <User size={14} />
                                Liên hệ SV
                              </button>
                            </div>
                          )}
                        </div>
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
                  e.target.style.borderColor = "#F59E0B";
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

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.topic && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={closeDetailModal}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              boxShadow:
                "0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.2)",
              animation: "modalSlideIn 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                paddingBottom: "24px",
                borderBottom:
                  "2px solid linear-gradient(90deg, #F59E0B, #F97316)",
                background: "linear-gradient(135deg, #FFF8F0 0%, #FEF3C7 100%)",
                padding: "20px 24px",
                borderRadius: "12px",
                margin: "-32px -32px 32px -32px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #F59E0B, #F97316)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <BookOpen size={24} color="white" />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#92400E",
                      margin: 0,
                      background: "linear-gradient(135deg, #92400E, #F59E0B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Chi tiết đề tài
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#A16207",
                      margin: "4px 0 0 0",
                      fontWeight: "500",
                    }}
                  >
                    {detailModal.topic.topicCode}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  background: "rgba(146, 64, 14, 0.1)",
                  border: "1px solid rgba(146, 64, 14, 0.2)",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#92400E",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(146, 64, 14, 0.2)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(146, 64, 14, 0.1)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "24px" }}>
              {/* Topic Information */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background:
                      "linear-gradient(90deg, #3B82F6, #6366F1, #8B5CF6)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <FileText size={18} color="white" />
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    Thông tin đề tài
                  </h3>
                </div>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "rgba(59, 130, 246, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={16} color="#3B82F6" />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: "500",
                            marginBottom: "2px",
                          }}
                        >
                          Mã đề tài
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#1e293b",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.topicCode}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          background: "rgba(34, 197, 94, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle size={16} color="#22C55E" />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            fontWeight: "500",
                            marginBottom: "2px",
                          }}
                        >
                          Trạng thái
                        </div>
                        <div
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background:
                              getStatusColor(detailModal.topic.status) + "20",
                            color: getStatusColor(detailModal.topic.status),
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            border: `1px solid ${getStatusColor(
                              detailModal.topic.status
                            )}30`,
                          }}
                        >
                          {getStatusIcon(detailModal.topic.status)}
                          {detailModal.topic.status}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Tên đề tài
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#1e293b",
                        fontWeight: "600",
                        lineHeight: "1.4",
                      }}
                    >
                      {detailModal.topic.title}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "500",
                        marginBottom: "4px",
                      }}
                    >
                      Mô tả
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#475569",
                        lineHeight: "1.5",
                      }}
                    >
                      {detailModal.topic.description}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "500",
                          marginBottom: "4px",
                        }}
                      >
                        Danh mục
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1e293b",
                          fontWeight: "500",
                        }}
                      >
                        {detailModal.topic.category}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "500",
                          marginBottom: "4px",
                        }}
                      >
                        Ngày đăng ký
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1e293b",
                          fontWeight: "500",
                        }}
                      >
                        {new Date(
                          detailModal.topic.submissionDate
                        ).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              {detailModal.topic.studentProfile && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(90deg, #F59E0B, #D97706, #B45309)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #F59E0B, #D97706)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      <User size={18} color="white" />
                    </div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#92400e",
                        margin: 0,
                      }}
                    >
                      Thông tin sinh viên
                    </h3>
                  </div>
                  <div style={{ display: "grid", gap: "16px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "rgba(245, 158, 11, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <User size={16} color="#F59E0B" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#92400e",
                              fontWeight: "500",
                              marginBottom: "2px",
                            }}
                          >
                            Họ và tên
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#92400e",
                              fontWeight: "600",
                            }}
                          >
                            {detailModal.topic.studentName}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            background: "rgba(245, 158, 11, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Mail size={16} color="#F59E0B" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#92400e",
                              fontWeight: "500",
                              marginBottom: "2px",
                            }}
                          >
                            Email
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#92400e",
                              fontWeight: "600",
                            }}
                          >
                            {detailModal.topic.studentProfile.studentEmail}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#92400e",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          Mã sinh viên
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#92400e",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.studentCode}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#92400e",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          Số điện thoại
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#92400e",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.studentProfile.phoneNumber}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#92400e",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          GPA
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#92400e",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.studentProfile.gpa}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#92400e",
                          fontWeight: "500",
                          marginBottom: "4px",
                        }}
                      >
                        Học lực
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#92400e",
                          fontWeight: "600",
                        }}
                      >
                        {detailModal.topic.studentProfile.academicStanding}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lecturer Information */}
              {detailModal.topic.lecturerProfile && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "1px solid rgba(14, 165, 233, 0.2)",
                    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(90deg, #0EA5E9, #0284C7, #0369A1)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(14, 165, 233, 0.3)",
                      }}
                    >
                      <User size={18} color="white" />
                    </div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#0C4A6E",
                        margin: 0,
                      }}
                    >
                      Thông tin giảng viên hướng dẫn
                    </h3>
                  </div>

                  <div style={{ display: "grid", gap: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <img
                        src={
                          getAvatarUrl(
                            detailModal.topic.lecturerProfile.profileImage
                          ) || "https://via.placeholder.com/80x80?text=No+Image"
                        }
                        alt="Lecturer"
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #0EA5E9",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#0C4A6E",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {detailModal.topic.lecturerProfile.fullName}
                        </h4>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#64748B",
                            margin: "0 0 8px 0",
                          }}
                        >
                          {detailModal.topic.lecturerProfile.degree ||
                            "Chưa cập nhật học vị"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            fontSize: "14px",
                            color: "#475569",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Mail size={16} />
                            {detailModal.topic.lecturerProfile.email}
                          </div>
                          {detailModal.topic.lecturerProfile.phoneNumber && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <User size={16} />
                              {detailModal.topic.lecturerProfile.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                        marginTop: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748B",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          Mã giảng viên
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#0C4A6E",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.supervisorLecturerCode}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748B",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          Khoa
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#0C4A6E",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.lecturerProfile.departmentCode ||
                            "Chưa cập nhật"}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#64748B",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          Học vị
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#0C4A6E",
                            fontWeight: "600",
                          }}
                        >
                          {detailModal.topic.lecturerProfile.degree ||
                            "Chưa cập nhật"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {detailModal.topic.comments && (
                <div
                  style={{
                    background: "#FEF3C7",
                    borderRadius: "8px",
                    padding: "16px",
                    border: "1px solid #F59E0B",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#92400E",
                      marginBottom: "8px",
                    }}
                  >
                    Nhận xét của giảng viên
                  </h3>
                  <p style={{ color: "#92400E", margin: 0 }}>
                    {detailModal.topic.comments}
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <button
                onClick={closeDetailModal}
                style={{
                  padding: "10px 24px",
                  background: "#6B7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4B5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#6B7280";
                }}
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

export default LecturerTopicReview;

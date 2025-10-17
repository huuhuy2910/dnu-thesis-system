import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Calendar,
  Clock,
  Download,
  User as UserIcon,
  BookOpen,
  Mail,
  Award,
  Users,
  Target,
  Hash,
  Tag as TagIcon,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import type { ApiResponse } from "../../types/api";
import type { SubmissionFile } from "../../types/submissionFile";
import type { Report } from "../../types/report";
import type { Topic } from "../../types/topic";
import type { LecturerProfile, Milestone } from "../../types/lecturer";
import type { Tag } from "../../types/tag";

const Reports: React.FC = () => {
  const auth = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lecturerProfile, setLecturerProfile] =
    useState<LecturerProfile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const navigate = useNavigate();

  // Fetch topic and lecturer info
  useEffect(() => {
    const fetchTopicAndLecturerInfo = async () => {
      if (!auth.user?.userCode) return;

      try {
        // Fetch topic
        const topicsRes = (await fetchData(
          `/Topics/get-list?ProposerUserCode=${auth.user.userCode}`
        )) as ApiResponse<Topic[]>;

        if (topicsRes.data && topicsRes.data.length > 0) {
          const userTopic = topicsRes.data[0]; // Get the first topic
          setTopic(userTopic);

          // Check if topic is pending approval
          if (userTopic.status === "Đang chờ") {
            setCanSubmit(false);
            setSubmitMessage(
              "Đề tài của bạn chưa được xét duyệt. Vui lòng chờ giảng viên duyệt đề tài trước khi nộp báo cáo."
            );
          }

          // Fetch milestones for the topic
          const milestonesRes = (await fetchData(
            `/ProgressMilestones/get-list?TopicCode=${userTopic.topicCode}`
          )) as ApiResponse<Milestone[]>;

          if (milestonesRes.data) {
            setMilestones(milestonesRes.data);
          }

          // Fetch lecturer profile if supervisor exists
          if (userTopic.supervisorLecturerCode) {
            const lecturerRes = (await fetchData(
              `/LecturerProfiles/get-detail/${userTopic.supervisorLecturerCode}`
            )) as ApiResponse<LecturerProfile>;

            if (lecturerRes.data) {
              setLecturerProfile(lecturerRes.data);

              // Fetch lecturer tags
              const tagsRes = (await fetchData(
                `/LecturerTags/list?LecturerCode=${userTopic.supervisorLecturerCode}`
              )) as ApiResponse<Record<string, unknown>[]>;

              if (tagsRes.data) {
                // Fetch tag details
                const tagCodes = tagsRes.data.map((s) => s.tagCode).join(",");
                const tagDetailsRes = (await fetchData(
                  `/Tags/list?TagCode=${tagCodes}`
                )) as ApiResponse<Tag[]>;

                if (tagDetailsRes.data) {
                  setTags(tagDetailsRes.data);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching topic and lecturer info:", error);
      }
    };

    fetchTopicAndLecturerInfo();
  }, [auth.user?.userCode]);

  // Fetch submission history and check submission permissions
  useEffect(() => {
    const fetchReports = async () => {
      if (!auth.user?.userCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch submissions
        const submissionsRes = (await fetchData(
          `/ProgressSubmissions/get-list?StudentUserCode=${auth.user.userCode}`
        )) as ApiResponse<Record<string, unknown>[]>;

        if (!submissionsRes.data || submissionsRes.data.length === 0) {
          setReports([]);
          setLoading(false);
          return;
        }

        // Sort by attemptNumber descending and get the latest submission
        const sortedSubmissions = submissionsRes.data.sort(
          (a: Record<string, unknown>, b: Record<string, unknown>) =>
            (b.attemptNumber as number) - (a.attemptNumber as number)
        );

        // Check if student can submit new report
        const latestSubmission = sortedSubmissions[0];
        if (latestSubmission) {
          const lecturerState = latestSubmission.lecturerState as string;
          if (!lecturerState || lecturerState.toLowerCase() === "pending") {
            setCanSubmit(false);
            setSubmitMessage(
              "Bạn cần chờ giảng viên nghiệm thu báo cáo trước khi nộp báo cáo mới."
            );
          } else {
            setCanSubmit(true);
            setSubmitMessage(null);
          }
        } else {
          setCanSubmit(true);
          setSubmitMessage(null);
        }

        // Fetch files for each submission
        const reportsWithFiles = await Promise.all(
          sortedSubmissions.map(async (submission: Record<string, unknown>) => {
            try {
              const filesRes = (await fetchData(
                `/SubmissionFiles/get-list?SubmissionCode=${submission.submissionCode}`
              )) as ApiResponse<SubmissionFile[]>;
              return {
                ...submission,
                files: filesRes.data || [],
              };
            } catch (error) {
              console.error(
                "Error fetching files for submission:",
                submission.submissionCode,
                error
              );
              return {
                ...submission,
                files: [],
              };
            }
          })
        );

        setReports(reportsWithFiles as Report[]);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [auth.user?.userCode]);

  // Check submission permissions based on topic status and latest submission
  useEffect(() => {
    // First priority: no topic registered
    if (!topic) {
      setCanSubmit(false);
      setSubmitMessage(
        "Bạn cần đăng ký đề tài và phải chờ xét duyệt trước khi nộp báo cáo."
      );
      return;
    }

    // Second priority: topic status
    if (topic.status === "Đang chờ") {
      setCanSubmit(false);
      setSubmitMessage(
        "Đề tài của bạn chưa được xét duyệt. Vui lòng chờ giảng viên duyệt đề tài trước khi nộp báo cáo."
      );
      return;
    }

    // Third priority: latest submission status
    if (reports.length > 0) {
      const latestSubmission = reports[0];
      const lecturerState = latestSubmission.lecturerState as string;
      if (!lecturerState || lecturerState.toLowerCase() === "pending") {
        setCanSubmit(false);
        setSubmitMessage(
          "Bạn cần chờ giảng viên nghiệm thu báo cáo trước khi nộp báo cáo mới."
        );
      } else {
        setCanSubmit(true);
        setSubmitMessage(null);
      }
    } else {
      // No submissions yet and topic is approved
      setCanSubmit(true);
      setSubmitMessage(null);
    }
  }, [topic, reports]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const getAbsoluteUrl = (url: string) => {
    if (/^https?:\/\//i.test(url)) return url;
    const envBase = (import.meta.env.VITE_API_BASE_URL || "").toString();
    if (!envBase) return url.startsWith("/") ? url : `/${url}`;
    const normalizedBase = envBase.endsWith("/")
      ? envBase.slice(0, -1)
      : envBase;
    return url.startsWith("/")
      ? `${normalizedBase}${url}`
      : `${normalizedBase}/${url}`;
  };

  const handleDownloadFile = async (
    file: SubmissionFile,
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();
    try {
      // Use the correct API endpoint for downloading files
      const downloadUrl = `/api/SubmissionFiles/download/${file.fileID}`;
      const url = getAbsoluteUrl(downloadUrl);

      const resp = await fetch(url, { credentials: "include" });

      if (!resp.ok) {
        // If server responds with unauthorized or redirect to login, send user to login
        if (resp.status === 401 || resp.status === 302 || resp.status === 403) {
          navigate("/login");
          return;
        }
        throw new Error(`Download failed with status ${resp.status}`);
      }

      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        // Probably redirected to login page
        navigate("/login");
        return;
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
      // Show simple feedback to user
      alert("Không thể tải file. Vui lòng thử lại hoặc đăng nhập lại.");
    }
  };

  const validateAndSetFile = (file: File) => {
    const errors: { [key: string]: string } = {};

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.file = "File không được vượt quá 10MB";
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      errors.file = "Chỉ chấp nhận file PDF, DOC, DOCX";
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);

    if (!canSubmit) {
      setSubmitting(false);
      return;
    }

    if (!selectedFile || !auth.user?.userCode) {
      setSubmitting(false);
      return;
    }

    try {
      // Get submission template
      const submissionTemplate = await fetchData(
        "/ProgressSubmissions/get-create"
      );
      const submissionData = (
        submissionTemplate as ApiResponse<Record<string, unknown>>
      ).data;

      // Get file template
      await fetchData("/SubmissionFiles/get-create");

      // Use the submissionCode from the template for both APIs
      const submissionCode =
        ((submissionData as Record<string, unknown>)
          ?.submissionCode as string) || "";

      // Create submission payload
      const submissionPayload = {
        ...submissionData,
        reportTitle,
        reportDescription,
        studentUserCode: auth.user.userCode,
        studentUserID: auth.user.userID,
        lecturerProfileID: lecturerProfile?.lecturerProfileID || null,
        lecturerCode: lecturerProfile?.lecturerCode || null,
        submittedAt: new Date().toISOString(),
        milestoneCode: milestones.length > 0 ? milestones[0].milestoneCode : "",
        milestoneID: milestones.length > 0 ? milestones[0].milestoneID : null,
      };

      // Create submission
      const createSubmissionRes = await fetchData(
        "/ProgressSubmissions/create",
        {
          method: "POST",
          body: submissionPayload,
        }
      );

      const createdSubmission = (
        createSubmissionRes as ApiResponse<Record<string, unknown>>
      ).data;

      if (!createdSubmission) {
        throw new Error("Failed to create submission");
      }

      // Create file payload using FormData (not JSON)
      const formData = new FormData();
      formData.append(
        "submissionID",
        String(
          (createdSubmission as Record<string, unknown>)?.submissionID || ""
        )
      );
      formData.append("submissionCode", submissionCode);
      formData.append("fileName", selectedFile.name);
      formData.append("fileSizeBytes", String(selectedFile.size));
      formData.append("mimeType", selectedFile.type);
      formData.append("uploadedAt", new Date().toISOString());
      formData.append("uploadedByUserCode", auth.user.userCode);
      formData.append("uploadedByUserID", String(auth.user.userID));
      formData.append("file", selectedFile); // Add the actual file

      // Upload file using FormData
      await fetchData("/SubmissionFiles/create", {
        method: "POST",
        body: formData,
      });

      setSuccess("Nộp báo cáo thành công!");
      setReportTitle("");
      setReportDescription("");
      setSelectedFile(null);

      // Refresh reports list
      const submissionsRes = (await fetchData(
        `/ProgressSubmissions/get-list?StudentUserCode=${auth.user.userCode}`
      )) as ApiResponse<Record<string, unknown>[]>;
      if (submissionsRes.data) {
        const reportsWithFiles = await Promise.all(
          submissionsRes.data.map(
            async (submission: Record<string, unknown>) => {
              try {
                const filesRes = (await fetchData(
                  `/SubmissionFiles/get-list?SubmissionCode=${submission.submissionCode}`
                )) as ApiResponse<SubmissionFile[]>;
                return {
                  ...submission,
                  files: filesRes.data || [],
                };
              } catch (error) {
                console.error("Error fetching files:", error);
                return {
                  ...submission,
                  files: [],
                };
              }
            }
          )
        );
        setReports(reportsWithFiles as Report[]);
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      // You might want to show an error message here
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (lecturerState?: string) => {
    switch (lecturerState?.toLowerCase()) {
      case "đã duyệt":
      case "approved":
      case "accepted":
        return "#22c55e";
      case "chờ duyệt":
      case "pending":
        return "#f37021";
      case "từ chối":
      case "rejected":
        return "#ef4444";
      case "revision":
        return "#eab308"; // Yellow for revision
      default:
        return "#94a3b8";
    }
  };

  const getStatusText = (lecturerState?: string) => {
    switch (lecturerState?.toLowerCase()) {
      case "đã duyệt":
      case "approved":
      case "accepted":
        return "Đã duyệt";
      case "chờ duyệt":
      case "pending":
        return "Chờ duyệt";
      case "từ chối":
      case "rejected":
        return "Từ chối";
      case "revision":
        return "Cần sửa";
      default:
        return "Chờ duyệt";
    }
  };

  const getFeedbackLevelText = (level?: string) => {
    switch (level?.toLowerCase()) {
      case "good":
        return "Tốt";
      case "moderate":
        return "Trung bình";
      case "high":
        return "Cao";
      case "normal":
        return "Bình thường";
      case "medium":
        return "Trung cấp";
      case "low":
        return "Thấp";
      default:
        return level || "";
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
        `}
      </style>
      {/* Topic and Lecturer Info */}
      {(topic || lecturerProfile) && (
        <div
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
            marginBottom: "32px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "6px",
              background:
                "linear-gradient(90deg, #f37021, #ff8c42, #3b82f6, #6366f1)",
              borderRadius: "20px 20px 0 0",
            }}
          />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#1a1a1a",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f37021, #ff8c42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={24} color="#fff" />
            </div>
            Thông tin đề tài và giảng viên hướng dẫn
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={24} color="#fff" />
            </div>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
            }}
          >
            {/* Topic Info */}
            {topic && (
              <div
                style={{
                  padding: "24px",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
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
                    background: "linear-gradient(90deg, #f37021, #ff8c42)",
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
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #f37021, #ff8c42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={20} color="#fff" />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#1a1a1a",
                        margin: 0,
                      }}
                    >
                      Đề tài của bạn
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Thông tin chi tiết về đề tài nghiên cứu
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <TagIcon size={16} color="#f37021" />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        Tiêu đề
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1a1a1a",
                          fontWeight: "500",
                        }}
                      >
                        {topic.title}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Hash size={14} color="#64748b" />
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Mã đề tài
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {topic.topicCode}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Target size={14} color="#64748b" />
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Loại đề tài
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {topic.type}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {topic.status === "Đã duyệt" ? (
                      <CheckCircle2 size={16} color="#22c55e" />
                    ) : (
                      <AlertCircle size={16} color="#f59e0b" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        Trạng thái
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          backgroundColor:
                            topic.status === "Đã duyệt" ? "#dcfce7" : "#fef3c7",
                          color:
                            topic.status === "Đã duyệt" ? "#166534" : "#92400e",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          display: "inline-block",
                          marginTop: "4px",
                        }}
                      >
                        {topic.status}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FileText size={14} color="#64748b" />
                      Tóm tắt đề tài
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        color: "#374151",
                        lineHeight: "1.6",
                      }}
                    >
                      {topic.summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lecturer Info */}
            {lecturerProfile && (
              <div
                style={{
                  padding: "24px",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
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
                    background: "linear-gradient(90deg, #3b82f6, #6366f1)",
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
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UserIcon size={20} color="#fff" />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#1a1a1a",
                        margin: 0,
                      }}
                    >
                      Giảng viên hướng dẫn
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Thông tin giảng viên phụ trách đề tài
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Name and Email */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <UserIcon size={16} color="#3b82f6" />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Họ và tên
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {lecturerProfile?.fullName || "Đang tải..."}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Mail size={16} color="#3b82f6" />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Email
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {lecturerProfile?.email || "Đang tải..."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lecturer Code and Degree */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Hash size={16} color="#64748b" />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Mã giảng viên
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {lecturerProfile.lecturerCode}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Award size={16} color="#64748b" />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            fontWeight: "600",
                          }}
                        >
                          Học vị
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#1a1a1a",
                            fontWeight: "500",
                          }}
                        >
                          {lecturerProfile.degree}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guide Quota Progress */}
                  <div
                    style={{
                      padding: "16px",
                      background: "#fff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        <Users size={14} color="#64748b" />
                        Hạn ngạch hướng dẫn
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#1a1a1a",
                          fontWeight: "600",
                        }}
                      >
                        {lecturerProfile.currentGuidingCount}/
                        {lecturerProfile.guideQuota}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            (lecturerProfile.currentGuidingCount /
                              lecturerProfile.guideQuota) *
                              100,
                            100
                          )}%`,
                          height: "100%",
                          background:
                            lecturerProfile.currentGuidingCount >=
                            lecturerProfile.guideQuota
                              ? "linear-gradient(90deg, #ef4444, #dc2626)"
                              : "linear-gradient(90deg, #22c55e, #16a34a)",
                          borderRadius: "3px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color:
                          lecturerProfile.currentGuidingCount >=
                          lecturerProfile.guideQuota
                            ? "#dc2626"
                            : "#64748b",
                        marginTop: "6px",
                        textAlign: "center",
                      }}
                    >
                      {lecturerProfile.currentGuidingCount >=
                      lecturerProfile.guideQuota
                        ? "Đã đạt hạn ngạch tối đa"
                        : `${
                            lecturerProfile.guideQuota -
                            lecturerProfile.currentGuidingCount
                          } vị trí còn trống`}
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div
                      style={{
                        padding: "16px",
                        background: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontWeight: "600",
                          marginBottom: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Target size={14} color="#64748b" />
                        Chuyên môn
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {tags.map((tag) => (
                          <span
                            key={tag.tagID}
                            style={{
                              padding: "6px 12px",
                              background:
                                "linear-gradient(135deg, #3b82f6, #6366f1)",
                              color: "#fff",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <TagIcon size={12} />
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Upload Form */}
        <div
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
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
              height: "6px",
              background:
                "linear-gradient(90deg, #f37021, #ff8c42, #3b82f6, #6366f1)",
              borderRadius: "20px 20px 0 0",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #f37021, #ff8c42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Upload size={28} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Nộp báo cáo mới
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "4px 0 0 0",
                }}
              >
                Tải lên báo cáo tiến độ của bạn
              </p>
            </div>
          </div>

          {success && (
            <div
              style={{
                background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                border: "1px solid #22c55e",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "24px",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)",
              }}
            >
              <CheckCircle2 size={20} />
              <div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  Thành công!
                </div>
                <div style={{ fontSize: "14px" }}>{success}</div>
              </div>
            </div>
          )}

          {submitMessage && (
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1px solid #f59e0b",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "24px",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)",
              }}
            >
              <Clock size={20} />
              <div>
                <div style={{ fontWeight: "600", marginBottom: "2px" }}>
                  Thông báo
                </div>
                <div style={{ fontSize: "14px" }}>{submitMessage}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <TagIcon size={16} color="#f37021" />
                Tiêu đề báo cáo *
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
                placeholder="Nhập tiêu đề báo cáo của bạn..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease",
                  backgroundColor: "#fff",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#f37021";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(243, 112, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileText size={16} color="#3b82f6" />
                Mô tả báo cáo
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn về nội dung báo cáo..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  transition: "all 0.3s ease",
                  backgroundColor: "#fff",
                  outline: "none",
                  lineHeight: "1.5",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Upload size={16} color="#22c55e" />
                Tải lên file báo cáo *
              </label>

              {!selectedFile ? (
                <div
                  style={{
                    border: `2px dashed ${isDragOver ? "#f37021" : "#d1d5db"}`,
                    borderRadius: "16px",
                    padding: "40px 32px",
                    textAlign: "center",
                    backgroundColor: isDragOver ? "#fff5f0" : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: isDragOver
                        ? "linear-gradient(135deg, #f37021, #ff8c42)"
                        : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <Upload size={32} color={isDragOver ? "#fff" : "#6b7280"} />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: isDragOver ? "#f37021" : "#374151",
                        margin: "0 0 4px 0",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {isDragOver
                        ? "Thả file vào đây!"
                        : "Kéo thả file vào đây"}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        margin: 0,
                      }}
                    >
                      hoặc nhấn để chọn file
                    </p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    required
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    border: "2px solid #22c55e",
                    borderRadius: "16px",
                    padding: "20px",
                    backgroundColor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#166534",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {selectedFile.name}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        margin: 0,
                      }}
                    >
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {selectedFile.type || "Unknown type"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#b91c1c";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#dc2626";
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {validationErrors.file && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px 12px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    color: "#dc2626",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertCircle size={14} />
                  {validationErrors.file}
                </div>
              )}

              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  <strong>Hỗ trợ:</strong> PDF, DOC, DOCX •{" "}
                  <strong>Tối đa:</strong> 10MB
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit || !selectedFile}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor:
                  submitting || !canSubmit || !selectedFile
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #f37021, #ff8c42)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "700",
                cursor:
                  submitting || !canSubmit || !selectedFile
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                boxShadow:
                  submitting || !canSubmit || !selectedFile
                    ? "none"
                    : "0 4px 12px rgba(243, 112, 33, 0.3)",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                if (!(submitting || !canSubmit || !selectedFile)) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(243, 112, 33, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(submitting || !canSubmit || !selectedFile)) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(243, 112, 33, 0.3)";
                }
              }}
            >
              {submitting ? (
                <>
                  <Clock size={20} />
                  Đang nộp báo cáo...
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
            background: "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
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
              height: "6px",
              background:
                "linear-gradient(90deg, #3b82f6, #6366f1, #f37021, #ff8c42)",
              borderRadius: "20px 20px 0 0",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar size={28} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Lịch sử nộp báo cáo
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: "4px 0 0 0",
                }}
              >
                Theo dõi tiến độ và trạng thái báo cáo
              </p>
            </div>
          </div>

          {loading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "140px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                    backgroundSize: "200px 100%",
                    animation: "shimmer 1.5s infinite",
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxHeight: "800px",
                overflowY: "auto",
                paddingRight: "8px",
              }}
            >
              {reports.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#64748b",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <FileText size={32} color="#94a3b8" />
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#374151",
                      margin: "0 0 8px 0",
                    }}
                  >
                    Chưa có báo cáo nào
                  </h3>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    Bạn chưa nộp báo cáo nào. Hãy nộp báo cáo đầu tiên của bạn!
                  </p>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.submissionID}
                    style={{
                      padding: "24px",
                      border: `2px solid ${getStatusColor(
                        report.lecturerState
                      )}`,
                      borderRadius: "16px",
                      backgroundColor:
                        report.lecturerState?.toLowerCase() === "đã duyệt" ||
                        report.lecturerState?.toLowerCase() === "approved" ||
                        report.lecturerState?.toLowerCase() === "accepted"
                          ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                          : report.lecturerState?.toLowerCase() ===
                              "chờ duyệt" ||
                            report.lecturerState?.toLowerCase() === "pending"
                          ? "linear-gradient(135deg, #fff5f0, #fed7aa)"
                          : report.lecturerState?.toLowerCase() === "revision"
                          ? "linear-gradient(135deg, #fefce8, #fde68a)"
                          : "linear-gradient(135deg, #fef2f2, #fecaca)",
                      transition: "all 0.3s ease",
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
                        background: `linear-gradient(90deg, ${getStatusColor(
                          report.lecturerState
                        )}, ${getStatusColor(report.lecturerState)}dd)`,
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "12px",
                              background: `linear-gradient(135deg, ${getStatusColor(
                                report.lecturerState
                              )}, ${getStatusColor(report.lecturerState)}dd)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={20} color="#fff" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#1a1a1a",
                                margin: "0 0 4px 0",
                                wordBreak: "break-word",
                              }}
                            >
                              {report.reportTitle}
                            </h3>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                fontSize: "12px",
                                color: "#64748b",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Calendar size={14} />
                                {new Date(
                                  report.submittedAt
                                ).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {report.feedbackLevel && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#f37021",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <TrendingUp size={14} />
                                  Đánh giá:{" "}
                                  {getFeedbackLevelText(report.feedbackLevel)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            padding: "6px 16px",
                            backgroundColor: getStatusColor(
                              report.lecturerState
                            ),
                            color: "#fff",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          {getStatusText(report.lecturerState)}
                        </span>
                      </div>
                    </div>

                    {report.reportDescription && (
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "rgba(255,255,255,0.8)",
                          borderRadius: "12px",
                          marginBottom: "16px",
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#64748b",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Mô tả báo cáo
                        </div>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#374151",
                            lineHeight: "1.6",
                            margin: 0,
                          }}
                        >
                          {report.reportDescription}
                        </p>
                      </div>
                    )}

                    {report.lecturerComment && (
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "rgba(255,255,255,0.8)",
                          borderRadius: "12px",
                          marginBottom: "16px",
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #f37021, #ff8c42)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          >
                            <UserIcon size={12} color="#fff" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#64748b",
                                marginBottom: "6px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Nhận xét từ giảng viên
                            </div>
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#374151",
                                lineHeight: "1.6",
                                margin: 0,
                              }}
                            >
                              {report.lecturerComment}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {report.files && report.files.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          File đính kèm ({report.files.length})
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {report.files.map((file) => (
                            <a
                              key={file.fileID}
                              href={file.fileURL}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 16px",
                                backgroundColor: "#f37021",
                                color: "#fff",
                                borderRadius: "12px",
                                fontSize: "13px",
                                fontWeight: "600",
                                textDecoration: "none",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 8px rgba(243, 112, 33, 0.2)",
                              }}
                              onClick={(e) => handleDownloadFile(file, e)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#d95f1a";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                  "0 4px 12px rgba(243, 112, 33, 0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#f37021";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                  "0 2px 8px rgba(243, 112, 33, 0.2)";
                              }}
                            >
                              <Download size={16} />
                              <span
                                style={{
                                  maxWidth: "150px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {file.fileName}
                              </span>
                              <span style={{ fontSize: "11px", opacity: 0.8 }}>
                                ({(file.fileSizeBytes / 1024).toFixed(1)} KB)
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

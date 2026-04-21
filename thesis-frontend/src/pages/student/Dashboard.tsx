import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchData, getAvatarUrl } from "../../api/fetchData";
import type { StudentProfile } from "../../types/studentProfile";
import type { Topic } from "../../types/topic";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type { TopicTag, Tag } from "../../types/tag";
import {
  User,
  BookOpen,
  TrendingUp,
  Bell,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import DefenseTermQuickInfo from "../../components/admin/DefenseTermQuickInfo";

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [supervisorNames, setSupervisorNames] = useState<
    Record<string, string>
  >({});
  const [topicTags, setTopicTags] = useState<Record<string, TopicTag[]>>({});
  const [tags, setTags] = useState<Record<string, Tag>>({});
  const [progressSummary, setProgressSummary] = useState<{
    total: number;
    completed: number;
    percentage: number;
    nextMilestone?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDataAsync = async () => {
      if (!auth.user?.userCode) {
        setError("Không tìm thấy mã người dùng");
        setLoading(false);
        return;
      }
      try {
        // Fetch profile
        const profileResponse = await fetchData<{ data: StudentProfile[] }>(
          `/StudentProfiles/get-list?UserCode=${auth.user.userCode}`,
        );
        if (profileResponse.data && profileResponse.data.length > 0) {
          setProfile(profileResponse.data[0]);
        } else {
          setError("Không tìm thấy thông tin hồ sơ sinh viên");
        }

        // Fetch topics
        const topicsResponse = await fetchData<{ data: Topic[] }>(
          `/Topics/get-list?ProposerStudentCode=${
            profileResponse.data[0]?.studentCode || auth.user.userCode
          }`,
        );
        const fetchedTopics = topicsResponse.data || [];
        setTopics(fetchedTopics);

        // Fetch supervisor names from LecturerProfiles
        const uniqueCodes = Array.from(
          new Set(
            fetchedTopics
              .map((t) => t.supervisorUserCode)
              .filter((code): code is string => code !== null),
          ),
        );
        const names: Record<string, string> = {};
        for (const code of uniqueCodes) {
          try {
            const lecturerResponse = await fetchData<{
              data: LecturerProfile[];
            }>(`/LecturerProfiles/get-list?UserCode=${code}`);
            const lecturerData = lecturerResponse.data || [];
            if (lecturerData.length > 0) {
              names[code] = lecturerData[0].fullName || code;
            }
          } catch {
            names[code] = code; // fallback to code
          }
        }
        setSupervisorNames(names);

        // Fetch topic tags and tag details
        const topicTagMap: Record<string, TopicTag[]> = {};
        const tagMap: Record<string, Tag> = {};
        const uniqueTagCodes = new Set<string>();

        for (const topic of fetchedTopics) {
          try {
            const topicTagResponse = await fetchData<{ data: TopicTag[] }>(
              `/TopicTags/list?TopicCode=${topic.topicCode}`,
            );
            const topicTagsData = topicTagResponse.data || [];
            topicTagMap[topic.topicCode] = topicTagsData;

            // Collect unique tag codes
            topicTagsData.forEach((tt) => {
              if (tt.tagCode) uniqueTagCodes.add(tt.tagCode);
            });
          } catch (err) {
            console.error("Error fetching topic tags:", err);
            topicTagMap[topic.topicCode] = [];
          }
        }

        // Fetch tag details
        for (const tagCode of uniqueTagCodes) {
          try {
            const tagResponse = await fetchData<{ data: Tag[] }>(
              `/Tags/list?TagCode=${tagCode}`,
            );
            const tagData = tagResponse.data || [];
            if (tagData.length > 0) {
              tagMap[tagCode] = tagData[0];
            }
          } catch (err) {
            console.error("Error fetching tag details:", err);
          }
        }

        setTopicTags(topicTagMap);
        setTags(tagMap);

        // Fetch progress summary for first topic
        if (fetchedTopics.length > 0) {
          try {
            const topicCode = fetchedTopics[0].topicCode;

            // Fetch milestone templates
            const templatesRes = await fetchData(
              "/MilestoneTemplates/get-list",
            );
            const templates = (templatesRes as { data?: unknown[] }).data || [];

            // Fetch progress milestones
            const progressRes = await fetchData(
              `/ProgressMilestones/get-list?TopicCode=${topicCode}`,
            );
            const progressMilestones =
              (progressRes as { data?: unknown[] }).data || [];

            // Calculate progress summary
            const highestOrdinal = Math.max(
              ...progressMilestones.map((pm: unknown) => {
                const template = templates.find(
                  (t: unknown) =>
                    (t as { milestoneTemplateCode?: string })
                      .milestoneTemplateCode ===
                    (pm as { milestoneTemplateCode?: string })
                      .milestoneTemplateCode,
                );
                return (template as { ordinal?: number })?.ordinal || 0;
              }),
            );

            let completedCount = 0;
            let nextMilestone: string | undefined;

            for (const template of templates) {
              const t = template as { ordinal?: number; name?: string };
              if (t.ordinal && t.ordinal < highestOrdinal) {
                completedCount++;
              } else if (t.ordinal === highestOrdinal && !nextMilestone) {
                nextMilestone = t.name;
              }
            }

            const total = templates.length;
            const percentage =
              total > 0 ? Math.round((completedCount / total) * 100) : 0;

            setProgressSummary({
              total,
              completed: completedCount,
              percentage,
              nextMilestone,
            });
          } catch (err) {
            console.error("Error fetching progress:", err);
            setProgressSummary(null);
          }
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAsync();
  }, [auth.user?.userCode]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 20 }}>Đang tải...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "red" }}>
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>Không có dữ liệu</div>
    );
  }

  // Giả lập dữ liệu còn lại (sau này sẽ gọi API khác)
  const notifications = [
    {
      id: 1,
      title: "Giảng viên đã nhận xét báo cáo chương 2",
      date: "03/10/2025",
      type: "success" as const,
      icon: CheckCircle,
    },
    {
      id: 2,
      title: "Cập nhật lịch bảo vệ dự kiến",
      date: "28/09/2025",
      type: "info" as const,
      icon: Calendar,
    },
    {
      id: 3,
      title: "Thông báo nộp file tiến độ tuần 4",
      date: "22/09/2025",
      type: "warning" as const,
      icon: Clock,
    },
    {
      id: 4,
      title: "Thông báo nộp file tiến độ tuần 5",
      date: "29/09/2025",
      type: "warning" as const,
      icon: AlertCircle,
    },
    {
      id: 5,
      title: "Thông báo nộp file tiến độ tuần 6",
      date: "6/10/2025",
      type: "warning" as const,
      icon: AlertCircle,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã duyệt":
        return { bg: "#10B981", text: "#FFFFFF" };
      case "Chờ duyệt":
        return { bg: "#F59E0B", text: "#FFFFFF" };
      case "Từ chối":
        return { bg: "#EF4444", text: "#FFFFFF" };
      default:
        return { bg: "#6B7280", text: "#FFFFFF" };
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "#10B981";
      case "warning":
        return "#F59E0B";
      case "info":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%)",
        padding: "24px",
      }}
    >

      <DefenseTermQuickInfo
        roleLabel="Sinh viên"
        termCode="2026.1"
        termName="Đợt bảo vệ HK2 năm học 2025-2026"
        roundIndex={1}
        status="Preparing"
      />

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Student Profile Card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <User size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Thông tin cá nhân
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                gap: "32px",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {profile?.studentImage ? (
                  <img
                    src={getAvatarUrl(profile.studentImage)}
                    alt="Ảnh sinh viên"
                    style={{
                      width: "140px",
                      height: "180px",
                      borderRadius: "16px",
                      objectFit: "cover",
                      border: "3px solid #F37021",
                      boxShadow: "0 8px 25px rgba(243, 112, 33, 0.2)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "140px",
                      height: "180px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #F3F4F6, #E5E7EB)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px solid #D1D5DB",
                    }}
                  >
                    <User size={48} color="#9CA3AF" />
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    right: "-8px",
                    background: "#10B981",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid white",
                  }}
                >
                  <CheckCircle size={16} color="white" />
                </div>
              </div>

              {/* Info Grid */}
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px 24px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Họ và tên
                  </label>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1F2937",
                      margin: 0,
                    }}
                  >
                    {profile?.fullName || auth.user?.fullName || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Mã sinh viên
                  </label>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1F2937",
                      margin: 0,
                    }}
                  >
                    {profile?.studentCode}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Email
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4B5563",
                      margin: 0,
                    }}
                  >
                    {profile?.studentEmail || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Lớp
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4B5563",
                      margin: 0,
                    }}
                  >
                    {profile?.classCode}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Khoa
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4B5563",
                      margin: 0,
                    }}
                  >
                    {profile?.facultyCode}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Ngành
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4B5563",
                      margin: 0,
                    }}
                  >
                    {profile?.departmentCode}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    GPA
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1F2937",
                        margin: 0,
                      }}
                    >
                      {profile?.gpa}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Học lực
                  </label>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4B5563",
                      margin: 0,
                    }}
                  >
                    {profile?.academicStanding}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Topics Section */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <Target size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Đề tài đồ án
              </h2>
            </div>

            {topics.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "linear-gradient(135deg, #F9FAFB, #F3F4F6)",
                  borderRadius: "16px",
                  border: "2px dashed #D1D5DB",
                }}
              >
                <BookOpen
                  size={64}
                  color="#9CA3AF"
                  style={{ marginBottom: "16px" }}
                />
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#6B7280",
                    margin: "0 0 8px 0",
                  }}
                >
                  Chưa có đề tài
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#9CA3AF",
                    margin: 0,
                  }}
                >
                  Bạn chưa đăng ký đề tài nào. Hãy liên hệ với giảng viên để
                  được hướng dẫn.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {topics.map((topic) => {
                  const statusColor = getStatusColor(topic.status);
                  return (
                    <div
                      key={topic.topicID}
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF, #F9FAFB)",
                        borderRadius: "16px",
                        padding: "24px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 25px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0, 0, 0, 0.05)";
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "16px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#1F2937",
                            margin: 0,
                            flex: 1,
                            marginRight: "16px",
                            lineHeight: "1.4",
                          }}
                        >
                          {topic.title}
                        </h3>
                        <span
                          style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {topic.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                          margin: "0 0 20px 0",
                          lineHeight: "1.6",
                        }}
                      >
                        {topic.summary}
                      </p>

                      {/* Details Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#F37021",
                            }}
                          ></div>
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>
                            <strong>Mã đề tài:</strong> {topic.topicCode}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#F37021",
                            }}
                          ></div>
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>
                            <strong>Loại:</strong> {topic.type}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#F37021",
                            }}
                          ></div>
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>
                            <strong>GV hướng dẫn:</strong>{" "}
                            {supervisorNames[topic.supervisorUserCode || ""] ||
                              "Chưa có"}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#F37021",
                            }}
                          ></div>
                          <span style={{ fontSize: "13px", color: "#6B7280" }}>
                            <strong>Tag:</strong>{" "}
                            {(topicTags[topic.topicCode] || [])
                              .map(
                                (tt) => tags[tt.tagCode]?.tagName || tt.tagCode,
                              )
                              .join(", ") || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress Section */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <TrendingUp size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Tiến độ đồ án
              </h2>
            </div>

            {!progressSummary ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                  borderRadius: "16px",
                  border: "1px solid #F59E0B",
                }}
              >
                <Clock
                  size={48}
                  color="#F59E0B"
                  style={{ marginBottom: "16px" }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#92400E",
                    margin: "0 0 8px 0",
                  }}
                >
                  Chưa có dữ liệu tiến độ
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#78350F",
                    margin: 0,
                  }}
                >
                  Vui lòng liên hệ giảng viên để cập nhật tiến độ.
                </p>
              </div>
            ) : (
              <div>
                {/* Progress Overview */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "24px",
                    border: "1px solid #0EA5E9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#0C4A6E",
                        margin: 0,
                      }}
                    >
                      {progressSummary.percentage}% Hoàn thành
                    </h3>
                    <div
                      style={{
                        background: "#10B981",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {progressSummary.completed}/{progressSummary.total} mốc
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      backgroundColor: "#E0F2FE",
                      borderRadius: "12px",
                      height: "16px",
                      overflow: "hidden",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: `${progressSummary.percentage}%`,
                        background: "linear-gradient(90deg, #F37021, #FF8C42)",
                        height: "100%",
                        borderRadius: "12px",
                        transition: "width 0.8s ease",
                        boxShadow: "0 0 10px rgba(243, 112, 33, 0.3)",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
                      color: "#0C4A6E",
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    Tiếp tục cố gắng! Bạn đang tiến bộ tốt.
                  </p>
                </div>

                {/* Next Milestone */}
                {progressSummary.nextMilestone && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                      borderRadius: "16px",
                      padding: "20px",
                      border: "1px solid #F59E0B",
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
                        background: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={24} color="white" />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#92400E",
                          margin: "0 0 4px 0",
                        }}
                      >
                        Mốc tiếp theo
                      </h4>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#78350F",
                          margin: 0,
                          fontWeight: "500",
                        }}
                      >
                        {progressSummary.nextMilestone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Notifications */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <Bell size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Thông báo
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {notifications.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "linear-gradient(135deg, #FFFFFF, #F9FAFB)",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0, 0, 0, 0.05)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: getNotificationColor(item.type),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={16} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1F2937",
                            margin: "0 0 4px 0",
                            lineHeight: "1.4",
                          }}
                        >
                          {item.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            margin: 0,
                          }}
                        >
                          {item.date}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <Calendar size={24} color="#F37021" />
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1F2937",
                  margin: 0,
                }}
              >
                Lịch sắp tới
              </h2>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #F0F9FF, #E0F2FE)",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #0EA5E9",
              }}
            >
              <div
                style={{
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
                    background: "linear-gradient(135deg, #F37021, #FF8C42)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar size={24} color="white" />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#0C4A6E",
                      margin: "0 0 4px 0",
                    }}
                  >
                    10/10/2025
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#0C4A6E",
                      margin: 0,
                      fontWeight: "500",
                    }}
                  >
                    Nộp báo cáo chương 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

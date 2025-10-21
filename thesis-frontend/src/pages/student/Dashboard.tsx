import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { fetchData } from "../../api/fetchData";
import type { StudentProfile } from "../../types/studentProfile";
import type { Topic } from "../../types/topic";
import type { LecturerProfile } from "../../types/lecturer-profile";
import type { TopicTag, Tag } from "../../types/tag";

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
          `/StudentProfiles/get-list?UserCode=${auth.user.userCode}`
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
          }`
        );
        const fetchedTopics = topicsResponse.data || [];
        setTopics(fetchedTopics);

        // Fetch supervisor names from LecturerProfiles
        const uniqueCodes = Array.from(
          new Set(
            fetchedTopics
              .map((t) => t.supervisorUserCode)
              .filter((code): code is string => code !== null)
          )
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
              `/TopicTags/list?TopicCode=${topic.topicCode}`
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
              `/Tags/list?TagCode=${tagCode}`
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
              "/MilestoneTemplates/get-list"
            );
            const templates = (templatesRes as { data?: unknown[] }).data || [];

            // Fetch progress milestones
            const progressRes = await fetchData(
              `/ProgressMilestones/get-list?TopicCode=${topicCode}`
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
                      .milestoneTemplateCode
                );
                return (template as { ordinal?: number })?.ordinal || 0;
              })
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
    },
    {
      id: 2,
      title: "Cập nhật lịch bảo vệ dự kiến",
      date: "28/09/2025",
    },
    {
      id: 3,
      title: "Thông báo nộp file tiến độ tuần 4",
      date: "22/09/2025",
    },
    {
      id: 4,
      title: "Thông báo nộp file tiến độ tuần 5",
      date: "29/09/2025",
    },
    {
      id: 5,
      title: "Thông báo nộp file tiến độ tuần 6",
      date: "6/10/2025",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "20px",
        padding: "10px 0",
      }}
    >
      {/* LEFT COLUMN */}
      <div>
        {/* THÔNG TIN SINH VIÊN */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#f37021", marginBottom: 12 }}>
            Thông tin sinh viên
          </h3>
          <div
            style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
          >
            {/* Ảnh sinh viên bên trái */}
            <div>
              {profile.studentImage ? (
                <img
                  src={profile.studentImage}
                  alt="Ảnh sinh viên"
                  style={{
                    width: 200,
                    height: 250,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "2px solid #f37021",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 220,
                    borderRadius: 8,
                    backgroundColor: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    fontSize: 12,
                  }}
                >
                  Không có ảnh
                </div>
              )}
            </div>

            {/* Thông tin bên phải */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Họ tên:
                  </span>
                  <span style={{ color: "#333" }}>
                    {profile?.fullName || auth.user?.fullName || "N/A"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Email:
                  </span>
                  <span style={{ color: "#333" }}>
                    {profile.studentEmail || "N/A"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Mã SV:
                  </span>
                  <span style={{ color: "#333" }}>{profile.studentCode}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Ngành:
                  </span>
                  <span style={{ color: "#333" }}>
                    {profile.departmentCode}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Lớp:
                  </span>
                  <span style={{ color: "#333" }}>{profile.classCode}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Khoa:
                  </span>
                  <span style={{ color: "#333" }}>{profile.facultyCode}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    GPA:
                  </span>
                  <span style={{ color: "#333" }}>{profile.gpa}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "#555", minWidth: 120 }}
                  >
                    Học lực:
                  </span>
                  <span style={{ color: "#333" }}>
                    {profile.academicStanding}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ĐỀ TÀI ĐỒ ÁN */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#f37021", marginBottom: 16, fontSize: 18 }}>
            Đề tài đồ án
          </h3>
          {topics.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#888",
                backgroundColor: "#f9f9f9",
                borderRadius: 8,
                border: "2px dashed #ddd",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 10 }}>📄</div>
              <p>Chưa có đề tài nào được đăng ký.</p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {topics.map((topic) => (
                <div
                  key={topic.topicID}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 12,
                    padding: 20,
                    backgroundColor: "#fafafa",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.1)";
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <h4
                      style={{
                        color: "#2d3748",
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 600,
                        flex: 1,
                        marginRight: 12,
                      }}
                    >
                      {topic.title}
                    </h4>
                    <span
                      style={{
                        backgroundColor:
                          topic.status === "Đã duyệt"
                            ? "#f37021"
                            : topic.status === "Chờ duyệt"
                            ? "#ed8936"
                            : "#e53e3e",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {topic.status}
                    </span>
                  </div>

                  {/* Summary */}
                  <p
                    style={{
                      color: "#4a5568",
                      fontSize: 14,
                      marginBottom: 16,
                      lineHeight: 1.5,
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
                      gap: "12px",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        Mã đề tài:
                      </span>
                      <span style={{ color: "#718096" }}>
                        {topic.topicCode}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        Loại:
                      </span>
                      <span style={{ color: "#718096" }}>{topic.type}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        GV hướng dẫn:
                      </span>
                      <span style={{ color: "#718096" }}>
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
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        Ngành:
                      </span>
                      <span style={{ color: "#718096" }}>
                        {topic.departmentCode || "N/A"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        Tag:
                      </span>
                      <span style={{ color: "#718096" }}>
                        {(topicTags[topic.topicCode] || [])
                          .map((tt) => tags[tt.tagCode]?.tagName || tt.tagCode)
                          .join(", ") || "N/A"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#2d3748" }}>
                        Lần nộp lại:
                      </span>
                      <span style={{ color: "#718096" }}>
                        {topic.resubmitCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TIẾN ĐỘ ĐỒ ÁN */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
            marginTop: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#f37021", marginBottom: 16, fontSize: 18 }}>
            Tiến độ đồ án
          </h3>
          {!progressSummary ? (
            <p style={{ color: "#888" }}>Chưa có dữ liệu tiến độ.</p>
          ) : (
            <>
              {/* Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#2d3748" }}>
                    Hoàn thành: {progressSummary.percentage}%
                  </span>
                  <span style={{ color: "#718096" }}>
                    {progressSummary.completed}/{progressSummary.total} mốc
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#eee",
                    borderRadius: 8,
                    height: 14,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressSummary.percentage}%`,
                      backgroundColor: "#f37021",
                      height: "100%",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              {/* Next Milestone */}
              {progressSummary.nextMilestone && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: "#fff5f0",
                    border: "1px solid #f37021",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#2d3748",
                  }}
                >
                  <strong style={{ color: "#f37021" }}>Mốc tiếp theo:</strong>{" "}
                  {progressSummary.nextMilestone}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div>
        {/* THÔNG BÁO */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            height: "325px", // Chiều cao bằng phần thông tin sinh viên (khoảng 250px ảnh + padding)
            paddingBottom: "10px", // Thêm padding bottom để chiều cao bằng phần thông tin sinh viên
          }}
        >
          <h3 style={{ color: "#f37021", marginBottom: 12 }}>
            Thông báo mới nhất
          </h3>
          <div
            style={{
              height: "250px", // Chiều cao cho phần cuộn
              overflowY: "auto", // Chỉ phần list thông báo cuộn
            }}
          >
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  borderBottom: "1px solid #f0f0f0",
                  padding: "8px 0",
                }}
              >
                <div style={{ fontWeight: 500, color: "#333" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MỐC SẮP TỚI */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 20,
            marginTop: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ color: "#f37021", marginBottom: 10 }}>Mốc sắp tới</h3>
          <p style={{ margin: 0, color: "#555", fontSize: 14 }}>
            📅 <strong>10/10/2025 - Nộp báo cáo chương 3</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

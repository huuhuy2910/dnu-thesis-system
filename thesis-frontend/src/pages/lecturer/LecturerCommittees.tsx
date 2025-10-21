import React, { useEffect, useState } from "react";
import { Calendar, Users, GraduationCap, MapPin, Eye } from "lucide-react";
import { fetchData } from "../../api/fetchData";
import { useAuth } from "../../hooks/useAuth";
import type { LecturerCommitteeItem } from "../../types/committee-assignment";
import type { LecturerCommitteesResponse } from "../../types/committee-assignment-responses";

const LecturerCommittees: React.FC = () => {
  const auth = useAuth();
  const [committees, setCommittees] = useState<LecturerCommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommittees = async () => {
      if (!auth.user?.userCode) {
        setError("Không tìm thấy mã người dùng");
        setLoading(false);
        return;
      }

      try {
        const response = await fetchData<LecturerCommitteesResponse>(
          `/CommitteeAssignment/lecturer-committees/${auth.user.userCode}`
        );
        if (response.success && response.data) {
          setCommittees(response.data.committees);
        } else {
          setError("Không thể tải danh sách hội đồng");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommittees();
  }, []);

  // viewing details is not implemented in this component; details API call available if needed

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

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
          <Users size={32} color="#F37021" />
          Hội đồng Bảo vệ của tôi
        </h1>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Xem danh sách các hội đồng bạn tham gia và đề tài cần bảo vệ
        </p>
      </div>

      {/* Committees List */}
      {committees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
            borderRadius: "12px",
            border: "2px dashed #E5E7EB",
          }}
        >
          <Users size={64} color="#CCC" style={{ marginBottom: "16px" }} />
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "8px",
            }}
          >
            Chưa có hội đồng bảo vệ
          </h3>
          <p style={{ color: "#666" }}>
            Hiện tại bạn chưa được phân công tham gia hội đồng bảo vệ nào. Vui
            lòng liên hệ với khoa để được hỗ trợ.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          {committees.map((committee) => (
            <div
              key={committee.committeeCode}
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(243, 112, 33, 0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "#F37021";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              {/* Committee Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
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
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background:
                          "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
                        color: "#F37021",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {committee.committeeCode}
                    </span>
                    {committee.tags && committee.tags.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        {committee.tags.map((tag) => (
                          <span
                            key={tag.tagCode}
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              background: "#E3F2FD",
                              color: "#1976D2",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "500",
                            }}
                          >
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    )}
                    {committee.members &&
                      committee.members.find(
                        (m) => m.lecturerCode === auth.user?.userCode
                      ) && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            background: committee.members.find(
                              (m) => m.lecturerCode === auth.user?.userCode
                            )?.isChair
                              ? "linear-gradient(135deg, #F37021 0%, #FF8838 100%)"
                              : "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {
                            committee.members.find(
                              (m) => m.lecturerCode === auth.user?.userCode
                            )?.role
                          }
                        </span>
                      )}
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      marginBottom: "12px",
                    }}
                  >
                    {committee.name}
                  </h3>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}
                  >
                    {committee.defenseDate && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Calendar size={16} color="#F37021" />
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          {new Date(committee.defenseDate).toLocaleDateString(
                            "vi-VN",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )}
                    {committee.room && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <MapPin size={16} color="#F37021" />
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          Phòng {committee.room}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <GraduationCap size={16} color="#F37021" />
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        {committee.assignments?.length || 0} đề tài
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    padding: "8px 16px",
                    background: "#F37021",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Eye size={16} />
                  Xem Chi Tiết
                </button>
              </div>

              {/* Members List */}
              {committee.members && committee.members.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid #E5E7EB",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#666",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Thành viên hội đồng ({committee.members.length})
                  </h4>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {committee.members.map((member) => (
                      <div
                        key={member.lecturerCode}
                        style={{
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px",
                          padding: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "#1a1a1a" }}>
                            {member.fullName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {member.degree} • {member.lecturerCode}
                          </div>
                          {member.tagNames && member.tagNames.length > 0 && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#888",
                                marginTop: "4px",
                              }}
                            >
                              {member.tagNames.join(", ")}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            background: member.isChair ? "#F37021" : "#10B981",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics List */}
              {committee.assignments && committee.assignments.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid #E5E7EB",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#666",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Đề tài bảo vệ ({committee.assignments.length})
                  </h4>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {committee.assignments.slice(0, 3).map((topic) => (
                      <div
                        key={topic.topicCode}
                        style={{
                          background: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          padding: "16px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FFF5F0";
                          e.currentTarget.style.borderColor = "#F37021";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#F9FAFB";
                          e.currentTarget.style.borderColor = "#E5E7EB";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              background: "white",
                              border: "1px solid #E5E7EB",
                              color: "#666",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {topic.topicCode}
                          </span>
                          {topic.session && (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                background: "#E3F2FD",
                                color: "#1976D2",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}
                            >
                              Session {topic.session}
                            </span>
                          )}
                        </div>
                        <h5
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                            marginBottom: "6px",
                          }}
                        >
                          {topic.title}
                        </h5>
                        {topic.studentName && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "4px",
                            }}
                          >
                            <strong>SV:</strong> {topic.studentName} (
                            {topic.studentCode})
                          </p>
                        )}
                        {topic.supervisorName && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "4px",
                            }}
                          >
                            <strong>GVHD:</strong> {topic.supervisorName} (
                            {topic.supervisorCode})
                          </p>
                        )}
                        {(topic.startTime || topic.endTime) && (
                          <p style={{ fontSize: "12px", color: "#666" }}>
                            <strong>Thời gian:</strong> {topic.startTime} -{" "}
                            {topic.endTime}
                          </p>
                        )}
                      </div>
                    ))}
                    {committee.assignments.length > 3 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          color: "#666",
                          fontSize: "12px",
                        }}
                      >
                        Và {committee.assignments.length - 3} đề tài khác...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LecturerCommittees;

import React, { useEffect, useState } from "react";
import { Calendar, Users, GraduationCap, MapPin, Eye } from "lucide-react";
import { committeeAssignmentApi } from "../../api/committeeAssignmentApi";
import type { LecturerCommitteeItem, CommitteeAssignmentDetail } from "../../api/committeeAssignmentApi";
import { ModalShell } from "../../pages/admin/committee/components/ModalShell";

const LecturerCommittees: React.FC = () => {
  const [committees, setCommittees] = useState<LecturerCommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeAssignmentDetail | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        // Assuming lecturerCode is available, e.g., from context or props. For now, hardcode or get from auth.
        const lecturerCode = "LECT01"; // Replace with actual lecturer code from auth/context
        const response = await committeeAssignmentApi.getLecturerCommittees(lecturerCode);
        if (response.success && response.data) {
          setCommittees(response.data.committees);
        } else {
          setError("Không thể tải danh sách hội đồng");
        }
      } catch {
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchCommittees();
  }, []);

  const handleViewDetails = async (committeeCode: string) => {
    try {
      const response = await committeeAssignmentApi.getCommitteeDetail(committeeCode);
      if (response.success && response.data) {
        setSelectedCommittee(response.data);
        setModalOpen(true);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết hội đồng", err);
    }
  };

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
            Hiện tại bạn chưa được phân công tham gia hội đồng bảo vệ nào. Vui lòng liên hệ với khoa để được hỗ trợ.
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
                    {committee.members && committee.members.find((m) => m.isChair) && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background:
                            "linear-gradient(135deg, #F37021 0%, #FF8838 100%)",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Chủ tịch
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
                  onClick={() => handleViewDetails(committee.committeeCode)}
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
                          <p style={{ fontSize: "12px", color: "#666" }}>
                            <strong>SV:</strong> {topic.studentName} (
                            {topic.studentCode})
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

      {modalOpen && selectedCommittee && (
        <ModalShell onClose={() => setModalOpen(false)} title="Chi Tiết Hội Đồng" wide>
          <div style={{ padding: "20px" }}>
            <h2 style={{ marginBottom: "20px", color: "#1a1a1a" }}>
              {selectedCommittee.name || selectedCommittee.committeeCode}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                }}
              >
                <strong>Mã hội đồng:</strong> {selectedCommittee.committeeCode}
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                }}
              >
                <strong>Ngày bảo vệ:</strong>{" "}
                {selectedCommittee.defenseDate
                  ? new Date(selectedCommittee.defenseDate).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                }}
              >
                <strong>Phòng:</strong> {selectedCommittee.room || "Chưa có"}
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                }}
              >
                <strong>Trạng thái:</strong> {selectedCommittee.status || "Chưa có"}
              </div>
            </div>

            {selectedCommittee.tags && selectedCommittee.tags.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ marginBottom: "12px", color: "#1a1a1a" }}>Tags:</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedCommittee.tags.map((tag) => (
                    <span
                      key={tag.tagCode}
                      style={{
                        padding: "4px 8px",
                        background: "#F37021",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {tag.tagName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ marginBottom: "12px", color: "#1a1a1a" }}>Thành Viên:</h3>
            <div style={{ marginBottom: "24px" }}>
              {selectedCommittee.members.map((member) => (
                <div
                  key={member.lecturerCode}
                  style={{
                    padding: "12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{member.fullName}</strong> ({member.lecturerCode})
                      {member.isChair && (
                        <span style={{ color: "#F37021", marginLeft: "8px" }}>
                          {" "}
                          - Chủ tịch
                        </span>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {member.role}
                      </span>
                      {member.degree && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          - {member.degree}
                        </span>
                      )}
                    </div>
                  </div>
                  {member.specialtyNames && member.specialtyNames.length > 0 && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      Chuyên ngành: {member.specialtyNames.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: "12px", color: "#1a1a1a" }}>Phiên Bảo Vệ:</h3>
            <div>
              {selectedCommittee.sessions && selectedCommittee.sessions.length > 0 ? (
                selectedCommittee.sessions.map((session) => (
                  <div key={session.session} style={{ marginBottom: "24px" }}>
                    <h4 style={{ marginBottom: "16px", color: "#1a1a1a", fontSize: "16px", fontWeight: "600" }}>
                      Phiên {session.session}
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {session.topics.map((topic) => {
                        // Find the corresponding assignment for more details
                        const assignment = selectedCommittee.assignments?.find(a => a.topicCode === topic.topicCode);
                        return (
                          <div
                            key={topic.topicCode}
                            style={{
                              padding: "16px",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                              background: "#F9FAFB",
                            }}
                          >
                            <div style={{ marginBottom: "12px" }}>
                              <strong style={{ fontSize: "16px", color: "#1a1a1a" }}>{topic.title}</strong>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#666" }}>
                              <div>
                                <strong>Mã:</strong> {topic.topicCode} | <strong>SV:</strong> {topic.studentName} ({topic.studentCode})
                              </div>
                              <div>
                                <strong>GVHD:</strong> {topic.supervisorName} ({topic.supervisorCode})
                              </div>
                              <div>
                                <strong>Ngày:</strong> {assignment?.scheduledAt ? new Date(assignment.scheduledAt).toLocaleDateString("vi-VN") : "Chưa có"}
                              </div>
                              <div>
                                <strong>Thời gian:</strong> {topic.startTime} - {topic.endTime}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Fallback: show assignments without sessions
                selectedCommittee.assignments && selectedCommittee.assignments.length > 0 && (
                  <div>
                    {selectedCommittee.assignments.map((assignment) => (
                      <div
                        key={assignment.topicCode}
                        style={{
                          padding: "16px",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          marginBottom: "12px",
                          background: "#F9FAFB",
                        }}
                      >
                        <div style={{ marginBottom: "12px" }}>
                          <strong style={{ fontSize: "16px", color: "#1a1a1a" }}>{assignment.title}</strong>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#666" }}>
                          <div>
                            <strong>Mã:</strong> {assignment.topicCode} | <strong>SV:</strong> {assignment.studentName} ({assignment.studentCode})
                          </div>
                          <div>
                            <strong>GVHD:</strong> {assignment.supervisorName} ({assignment.supervisorCode})
                          </div>
                          <div>
                            <strong>Ngày:</strong> {assignment.scheduledAt ? new Date(assignment.scheduledAt).toLocaleDateString("vi-VN") : "Chưa có"}
                          </div>
                          <div>
                            <strong>Thời gian:</strong> {assignment.startTime} - {assignment.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default LecturerCommittees;

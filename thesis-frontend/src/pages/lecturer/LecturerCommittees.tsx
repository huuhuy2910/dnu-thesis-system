import React, { useEffect, useState } from "react";
import { Calendar, Users, GraduationCap, MapPin, Eye } from "lucide-react";
import { committeeAssignmentApi } from "../../api/committeeAssignmentApi";
import type { LecturerCommitteeItem } from "../../types/committee-assignment";

const LecturerCommittees: React.FC = () => {
  const [committees, setCommittees] = useState<LecturerCommitteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
};

export default LecturerCommittees;

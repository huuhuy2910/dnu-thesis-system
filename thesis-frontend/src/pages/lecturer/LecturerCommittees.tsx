import React, { useState } from "react";
import { Calendar, Users, GraduationCap, MapPin } from "lucide-react";

interface CommitteeMember {
  committeeMemberID: number;
  lecturerCode: string;
  lecturerName: string;
  degree?: string;
  role: string;
  isChair: boolean;
}

interface DefenseTopic {
  topicCode: string;
  title: string;
  studentCode?: string;
  studentName?: string;
  scheduledAt?: string;
}

interface Committee {
  committeeCode: string;
  name: string;
  defenseDate?: string;
  room?: string;
  members: CommitteeMember[];
  assignedTopics: DefenseTopic[];
}

interface LecturerCommitteesDto {
  lecturerName: string;
  lecturerCode: string;
  committees: Committee[];
}

const LecturerCommittees: React.FC = () => {
  const [data] = useState<LecturerCommitteesDto>({
    lecturerName: "PGS.TS Nguyễn Thị B",
    lecturerCode: "GV001",
    committees: [
      {
        committeeCode: "HD2025001",
        name: "Hội đồng bảo vệ CNTT 2025",
        defenseDate: "2025-12-15",
        room: "A101",
        members: [
          {
            committeeMemberID: 1,
            lecturerCode: "GV001",
            lecturerName: "PGS.TS Nguyễn Thị B",
            degree: "PGS.TS",
            role: "Chủ tịch",
            isChair: true,
          },
          {
            committeeMemberID: 2,
            lecturerCode: "GV002",
            lecturerName: "TS Trần Văn C",
            degree: "TS",
            role: "Thư ký",
            isChair: false,
          },
          {
            committeeMemberID: 3,
            lecturerCode: "GV003",
            lecturerName: "TS Lê Thị D",
            degree: "TS",
            role: "Phản biện",
            isChair: false,
          },
          {
            committeeMemberID: 4,
            lecturerCode: "GV004",
            lecturerName: "ThS Phạm Văn E",
            degree: "ThS",
            role: "Ủy viên",
            isChair: false,
          },
          {
            committeeMemberID: 5,
            lecturerCode: "GV005",
            lecturerName: "TS Hoàng Thị F",
            degree: "TS",
            role: "Ủy viên",
            isChair: false,
          },
        ],
        assignedTopics: [
          {
            topicCode: "DT2024001",
            title: "Ứng dụng trí tuệ nhân tạo trong phân tích dữ liệu lớn",
            studentCode: "SV2024001",
            studentName: "Nguyễn Văn A",
            scheduledAt: "2025-12-15T14:00:00",
          },
          {
            topicCode: "DT2024003",
            title: "Hệ thống quản lý thư viện thông minh",
            studentCode: "SV2024003",
            studentName: "Lê Văn C",
            scheduledAt: "2025-12-15T15:30:00",
          },
        ],
      },
      {
        committeeCode: "HD2025002",
        name: "Hội đồng bảo vệ CNTT 2025 (Đợt 2)",
        defenseDate: "2025-12-20",
        room: "A102",
        members: [
          {
            committeeMemberID: 6,
            lecturerCode: "GV006",
            lecturerName: "PGS.TS Trần Văn G",
            degree: "PGS.TS",
            role: "Chủ tịch",
            isChair: true,
          },
          {
            committeeMemberID: 7,
            lecturerCode: "GV001",
            lecturerName: "PGS.TS Nguyễn Thị B",
            degree: "PGS.TS",
            role: "Thư ký",
            isChair: false,
          },
          {
            committeeMemberID: 8,
            lecturerCode: "GV007",
            lecturerName: "TS Phạm Thị H",
            degree: "TS",
            role: "Phản biện",
            isChair: false,
          },
        ],
        assignedTopics: [
          {
            topicCode: "DT2024002",
            title: "Phát triển ứng dụng di động cho giáo dục",
            studentCode: "SV2024002",
            studentName: "Trần Thị B",
            scheduledAt: "2025-12-20T09:00:00",
          },
          {
            topicCode: "DT2024005",
            title: "Phân tích cảm xúc trong mạng xã hội",
            studentCode: "SV2024005",
            studentName: "Hoàng Văn E",
            scheduledAt: "2025-12-20T10:30:00",
          },
        ],
      },
    ],
  });

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

      {/* Lecturer Info */}
      {data && (
        <div
          style={{
            background: "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
            border: "1px solid #F37021",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #F37021 0%, #FF8838 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(243, 112, 33, 0.3)",
            }}
          >
            {data.lecturerName.charAt(0)}
          </div>
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "4px",
              }}
            >
              {data.lecturerName}
            </h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Mã giảng viên: <strong>{data.lecturerCode}</strong> • Tham gia{" "}
              <strong>{data.committees.length}</strong> hội đồng
            </p>
          </div>
        </div>
      )}

      {/* Committees List */}
      {data && data.committees.length === 0 ? (
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
            Chưa có hội đồng nào
          </h3>
          <p style={{ color: "#666" }}>
            Bạn chưa được phân công tham gia hội đồng bảo vệ nào.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          {data?.committees.map((committee) => (
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
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: committee.members.find(
                          (m) => m.lecturerCode === data.lecturerCode
                        )?.isChair
                          ? "linear-gradient(135deg, #F37021 0%, #FF8838 100%)"
                          : committee.members.find(
                              (m) => m.lecturerCode === data.lecturerCode
                            )?.role === "Thư ký"
                          ? "#E0F2FE"
                          : "#F3F4F6",
                        color: committee.members.find(
                          (m) => m.lecturerCode === data.lecturerCode
                        )?.isChair
                          ? "white"
                          : committee.members.find(
                              (m) => m.lecturerCode === data.lecturerCode
                            )?.role === "Thư ký"
                          ? "#0369A1"
                          : "#666",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {
                        committee.members.find(
                          (m) => m.lecturerCode === data.lecturerCode
                        )?.role
                      }
                    </span>
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
                        {committee.assignedTopics.length} đề tài
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topics List */}
              {committee.assignedTopics.length > 0 && (
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
                    Đề tài bảo vệ ({committee.assignedTopics.length})
                  </h4>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {committee.assignedTopics.map((topic) => (
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
                          {topic.scheduledAt && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Calendar size={14} color="#F37021" />
                              <span style={{ fontSize: "12px", color: "#666" }}>
                                {new Date(topic.scheduledAt).toLocaleString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
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
                          <p style={{ fontSize: "12px", color: "#666" }}>
                            <strong>SV:</strong> {topic.studentName} (
                            {topic.studentCode})
                          </p>
                        )}
                      </div>
                    ))}
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

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Plus,
  Loader,
  AlertCircle,
  User,
  Shield,
  FileText,
  Award,
  Clock,
} from "lucide-react";

// Types based on database schema
interface CommitteeMember {
  committeeMemberID: number;
  committeeID: number;
  committeeCode: string;
  memberLecturerProfileID: number;
  memberLecturerCode: string;
  memberUserID: number;
  memberUserCode: string;
  role: string;
  isChair: boolean;
  createdAt: string;
  lastUpdated: string;
  // Additional display fields
  lecturerName?: string;
  degree?: string;
  department?: string;
  experience?: string;
}

interface Committee {
  committeeID: number;
  committeeCode: string;
  name: string;
  defenseDate: string;
  room: string;
  createdAt: string;
  lastUpdated: string;
  // Additional computed fields
  status?: "upcoming" | "ongoing" | "completed";
  statusText?: string;
  members?: CommitteeMember[];
  totalTopics?: number;
  completedTopics?: number;
  averageScore?: number;
}

// Mock data based on database schema
const mockCommitteeMembers: CommitteeMember[] = [
  {
    committeeMemberID: 1,
    committeeID: 1,
    committeeCode: "HD2025001",
    memberLecturerProfileID: 101,
    memberLecturerCode: "GV001",
    memberUserID: 201,
    memberUserCode: "USR001",
    role: "Chủ tịch Hội đồng",
    isChair: true,
    createdAt: "2025-10-01T08:00:00.000Z",
    lastUpdated: "2025-10-01T08:00:00.000Z",
    lecturerName: "TS. Nguyễn Văn An",
    degree: "Tiến sĩ",
    department: "Công nghệ Thông tin",
    experience: "15 năm kinh nghiệm",
  },
  {
    committeeMemberID: 2,
    committeeID: 1,
    committeeCode: "HD2025001",
    memberLecturerProfileID: 102,
    memberLecturerCode: "GV002",
    memberUserID: 202,
    memberUserCode: "USR002",
    role: "Ủy viên",
    isChair: false,
    createdAt: "2025-10-01T08:00:00.000Z",
    lastUpdated: "2025-10-01T08:00:00.000Z",
    lecturerName: "PGS.TS. Trần Thị Bình",
    degree: "Phó Giáo sư - Tiến sĩ",
    department: "Công nghệ Thông tin",
    experience: "12 năm kinh nghiệm",
  },
  {
    committeeMemberID: 3,
    committeeID: 1,
    committeeCode: "HD2025001",
    memberLecturerProfileID: 103,
    memberLecturerCode: "GV003",
    memberUserID: 203,
    memberUserCode: "USR003",
    role: "Ủy viên",
    isChair: false,
    createdAt: "2025-10-01T08:00:00.000Z",
    lastUpdated: "2025-10-01T08:00:00.000Z",
    lecturerName: "TS. Lê Văn Cường",
    degree: "Tiến sĩ",
    department: "Công nghệ Thông tin",
    experience: "10 năm kinh nghiệm",
  },
  {
    committeeMemberID: 4,
    committeeID: 1,
    committeeCode: "HD2025001",
    memberLecturerProfileID: 104,
    memberLecturerCode: "GV004",
    memberUserID: 204,
    memberUserCode: "USR004",
    role: "Ủy viên",
    isChair: false,
    createdAt: "2025-10-01T08:00:00.000Z",
    lastUpdated: "2025-10-01T08:00:00.000Z",
    lecturerName: "ThS. Phạm Thị Dung",
    degree: "Thạc sĩ",
    department: "Công nghệ Thông tin",
    experience: "8 năm kinh nghiệm",
  },
  {
    committeeMemberID: 5,
    committeeID: 1,
    committeeCode: "HD2025001",
    memberLecturerProfileID: 105,
    memberLecturerCode: "GV005",
    memberUserID: 205,
    memberUserCode: "USR005",
    role: "Thư ký",
    isChair: false,
    createdAt: "2025-10-01T08:00:00.000Z",
    lastUpdated: "2025-10-01T08:00:00.000Z",
    lecturerName: "ThS. Hoàng Văn Em",
    degree: "Thạc sĩ",
    department: "Công nghệ Thông tin",
    experience: "6 năm kinh nghiệm",
  },
];

const mockCommittee: Committee = {
  committeeID: 1,
  committeeCode: "HD2025001",
  name: "Hội đồng Bảo vệ Luận văn CNTT - Kỳ 2025.1",
  defenseDate: "2025-11-15",
  room: "A101",
  createdAt: "2025-10-01T08:00:00.000Z",
  lastUpdated: "2025-10-01T08:00:00.000Z",
  status: "upcoming",
  statusText: "SẮP DIỄN RA",
  members: mockCommitteeMembers,
  totalTopics: 8,
  completedTopics: 0,
  averageScore: 0,
};

const CommitteeDetail: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "topics">(
    "overview"
  );
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      loadCommitteeDetail();
    }
  }, [code]);

  const loadCommitteeDetail = async () => {
    // Simulate API call
    setTimeout(() => {
      setCommittee(mockCommittee);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "#4F46E5"; // Soft indigo
      case "ongoing":
        return "#059669"; // Soft green
      case "completed":
        return "#6B7280"; // Soft gray
      default:
        return "#6B7280";
    }
  };

  const getTopicStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B"; // Soft amber
      case "in_progress":
        return "#3B82F6"; // Soft blue
      case "completed":
        return "#10B981"; // Soft emerald
      default:
        return "#6B7280";
    }
  };

  const getTopicStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "CHỜ BẢO VỆ";
      case "in_progress":
        return "ĐANG BẢO VỆ";
      case "completed":
        return "ĐÃ HOÀN THÀNH";
      default:
        return "CHƯA XÁC ĐỊNH";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "100px",
          gap: "16px",
          background: "#F9FAFB",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
        }}
      >
        <Loader
          size={32}
          color="#6B7280"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span style={{ color: "#374151", fontSize: "18px", fontWeight: "500" }}>
          ĐANG TẢI THÔNG TIN HỘI ĐỒNG...
        </span>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div style={{ padding: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "12px",
          }}
        >
          <AlertCircle size={24} color="#DC2626" />
          <span
            style={{ color: "#DC2626", fontSize: "16px", fontWeight: "500" }}
          >
            {error || "KHÔNG TÌM THẤY HỘI ĐỒNG"}
          </span>
        </div>
        <button
          onClick={() => navigate("/admin/committees")}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4338CA";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4F46E5";
          }}
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
        background: "#F9FAFB",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          background: "#FFFFFF",
          padding: "32px",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/admin/committees")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              marginBottom: "16px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E5E7EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <Shield size={36} color="#6B7280" />
            CHI TIẾT HỘI ĐỒNG BẢO VỆ
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#6B7280",
              margin: 0,
              fontWeight: "400",
            }}
          >
            QUẢN LÝ CHI TIẾT HỘI ĐỒNG VÀ CÁC ĐỀ TÀI ĐƯỢC PHÂN CÔNG
          </p>
        </div>

        {/* Status Badge */}
        <div
          style={{
            padding: "12px 24px",
            background: getStatusColor(committee.status || "upcoming"),
            color: "white",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {committee.statusText}
        </div>
      </div>

      {/* Committee Info Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "32px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E5E7EB",
            }}
          >
            <Shield size={32} color="#6B7280" />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              MÃ HỘI ĐỒNG
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              {committee.committeeCode}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E5E7EB",
            }}
          >
            <Calendar size={32} color="#6B7280" />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              NGÀY BẢO VỆ
            </div>
            <div
              style={{ fontSize: "18px", fontWeight: "600", color: "#111827" }}
            >
              {new Date(committee.defenseDate).toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E5E7EB",
            }}
          >
            <MapPin size={32} color="#6B7280" />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              PHÒNG BẢO VỆ
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              Phòng {committee.room}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "12px",
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E5E7EB",
            }}
          >
            <FileText size={32} color="#6B7280" />
          </div>
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              TỔNG ĐỀ TÀI
            </div>
            <div
              style={{ fontSize: "20px", fontWeight: "600", color: "#111827" }}
            >
              {committee.totalTopics} đề tài
            </div>
          </div>
        </div>
      </div>

      {/* Committee Name */}
      <div
        style={{
          background: "#FFFFFF",
          color: "#111827",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "32px",
          textAlign: "center",
          border: "1px solid #E5E7EB",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            margin: 0,
            color: "#111827",
          }}
        >
          {committee.name}
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "32px",
          background: "#FFFFFF",
          padding: "8px",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
        }}
      >
        {[
          { key: "overview", label: "Tổng quan", icon: Shield },
          { key: "members", label: "Thành viên", icon: Users },
          { key: "topics", label: "Đề tài", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key as "overview" | "members" | "topics")
            }
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "16px",
              background: activeTab === tab.key ? "#4F46E5" : "transparent",
              color: activeTab === tab.key ? "white" : "#6B7280",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "24px",
            }}
          >
            Tổng quan hội đồng
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Progress Stats */}
            <div
              style={{
                background: "#F9FAFB",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
              }}
            >
              <h4
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "16px",
                }}
              >
                Tiến độ bảo vệ
              </h4>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: `conic-gradient(#10B981 0% ${
                      ((committee.completedTopics || 0) /
                        (committee.totalTopics || 1)) *
                      100
                    }%, #E5E7EB ${
                      ((committee.completedTopics || 0) /
                        (committee.totalTopics || 1)) *
                      100
                    }% 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {committee.completedTopics}/{committee.totalTopics}
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      marginBottom: "4px",
                    }}
                  >
                    Đã hoàn thành
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {Math.round(
                      ((committee.completedTopics || 0) /
                        (committee.totalTopics || 1)) *
                        100
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Average Score */}
            <div
              style={{
                background: "#F9FAFB",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
              }}
            >
              <h4
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "16px",
                }}
              >
                Điểm trung bình
              </h4>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Award size={32} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      marginBottom: "4px",
                    }}
                  >
                    Trung bình
                  </div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "#10B981",
                    }}
                  >
                    {committee.averageScore?.toFixed(1) || "0.0"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#111827",
                margin: 0,
              }}
            >
              Thành viên hội đồng ({committee.members?.length || 0})
            </h3>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4338CA";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4F46E5";
              }}
            >
              <Plus size={16} />
              Thêm thành viên
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {committee.members?.map((member) => (
              <div
                key={member.committeeMemberID}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                  e.currentTarget.style.borderColor = "#D1D5DB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: member.isChair ? "#4F46E5" : "#6B7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                  }}
                >
                  <User size={24} color="white" />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      {member.lecturerName}
                    </h4>
                    {member.isChair && (
                      <span
                        style={{
                          padding: "4px 12px",
                          background: "#4F46E5",
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        CHỦ TỊCH
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "14px",
                      color: "#6B7280",
                    }}
                  >
                    <span>Mã GV: {member.memberLecturerCode}</span>
                    <span>•</span>
                    <span>{member.degree}</span>
                    <span>•</span>
                    <span>{member.role}</span>
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      marginTop: "4px",
                    }}
                  >
                    {member.department} • {member.experience}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "#3B82F6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B82F6";
                    }}
                  >
                    Xem
                  </button>
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "#F59E0B",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#D97706";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F59E0B";
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "#DC2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#B91C1C";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "topics" && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            padding: "32px",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#111827",
                margin: 0,
              }}
            >
              Đề tài được phân công ({committee.totalTopics})
            </h3>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4338CA";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4F46E5";
              }}
            >
              <Plus size={16} />
              Phân công đề tài
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {/* Sample topics - you can expand this */}
            {[
              {
                topicCode: "DT001",
                title:
                  "Phát triển ứng dụng di động quản lý kho hàng thông minh",
                studentName: "Nguyễn Văn A",
                studentCode: "SV001",
                scheduledAt: "2025-11-15T08:00:00",
                status: "pending",
              },
              {
                topicCode: "DT002",
                title: "Hệ thống AI phân tích dữ liệu bán hàng",
                studentName: "Trần Thị B",
                studentCode: "SV002",
                scheduledAt: "2025-11-15T09:30:00",
                status: "pending",
              },
            ].map((topic) => (
              <div
                key={topic.topicCode}
                style={{
                  padding: "20px",
                  background: "#F9FAFB",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                  e.currentTarget.style.borderColor = "#D1D5DB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: "0 0 8px 0",
                      }}
                    >
                      {topic.title}
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        fontSize: "14px",
                        color: "#6B7280",
                      }}
                    >
                      <span>Mã đề tài: {topic.topicCode}</span>
                      <span>•</span>
                      <span>
                        Sinh viên: {topic.studentName} ({topic.studentCode})
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      background: getTopicStatusColor(topic.status),
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    {getTopicStatusText(topic.status)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    fontSize: "14px",
                    color: "#6B7280",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={16} />
                    {new Date(topic.scheduledAt).toLocaleString("vi-VN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "#3B82F6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#3B82F6";
                    }}
                  >
                    Xem chi tiết
                  </button>
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "#F59E0B",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#D97706";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F59E0B";
                    }}
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeDetail;

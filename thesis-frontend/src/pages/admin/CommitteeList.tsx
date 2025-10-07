import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Plus,
  Eye,
  AlertCircle,
  Loader,
  Shield,
  FileText,
  MapPin,
} from "lucide-react";

// Mock Data - Dữ liệu mẫu hội đồng bảo vệ
interface MockCommittee {
  committeeCode: string;
  name: string;
  defenseDate: string;
  room: string;
  status: "upcoming" | "ongoing" | "completed";
  statusText: string;
  memberCount: number;
  topicCount: number;
}

const mockCommittees: MockCommittee[] = [
  {
    committeeCode: "HD2025001",
    name: "Hội đồng Bảo vệ Luận văn CNTT - Kỳ 2025.1",
    defenseDate: "2025-11-15",
    room: "A101",
    status: "upcoming",
    statusText: "SẮP DIỄN RA",
    memberCount: 5,
    topicCount: 8,
  },
  {
    committeeCode: "HD2025002",
    name: "Hội đồng Bảo vệ Luận văn HTTT - Kỳ 2025.1",
    defenseDate: "2025-11-18",
    room: "B205",
    status: "upcoming",
    statusText: "SẮP DIỄN RA",
    memberCount: 4,
    topicCount: 6,
  },
  {
    committeeCode: "HD2025003",
    name: "Hội đồng Bảo vệ Luận văn KHDL - Kỳ 2025.1",
    defenseDate: "2025-11-20",
    room: "C301",
    status: "upcoming",
    statusText: "SẮP DIỄN RA",
    memberCount: 5,
    topicCount: 7,
  },
  {
    committeeCode: "HD2024001",
    name: "Hội đồng Bảo vệ Luận văn CNTT - Kỳ 2024.2",
    defenseDate: "2025-06-15",
    room: "A102",
    status: "completed",
    statusText: "ĐÃ HOÀN THÀNH",
    memberCount: 5,
    topicCount: 9,
  },
  {
    committeeCode: "HD2024002",
    name: "Hội đồng Bảo vệ Luận văn HTTT - Kỳ 2024.2",
    defenseDate: "2025-06-18",
    room: "B206",
    status: "completed",
    statusText: "ĐÃ HOÀN THÀNH",
    memberCount: 4,
    topicCount: 7,
  },
];

const CommitteeList: React.FC = () => {
  const navigate = useNavigate();
  const [committees] = useState<MockCommittee[]>(mockCommittees);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    loadCommittees();
  }, []);

  const loadCommittees = async () => {
    // For now, we don't have a list endpoint, so this is placeholder
    // You may want to add a GetAllCommitteesAsync method in the backend
    setLoading(false);
  };

  const handleCreateNew = () => {
    navigate("/admin/committees/create");
  };

  const handleViewDetail = (code: string) => {
    navigate(`/admin/committees/detail/${code}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "#f37021";
      case "ongoing":
        return "#002855";
      case "completed":
        return "#002855";
      default:
        return "#6B7280";
    }
  };

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
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
          background: "linear-gradient(135deg, #f37021 0%, #d85f1a 100%)",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(243, 112, 33, 0.3)",
          border: "2px solid #fff",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#fff",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Shield size={36} />
            QUẢN LÝ HỘI ĐỒNG BẢO VỆ
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#fff",
              margin: 0,
              opacity: 0.95,
              fontWeight: "500",
            }}
          >
            TẠO VÀ QUẢN LÝ CÁC HỘI ĐỒNG BẢO VỆ LUẬN VĂN TỐT NGHIỆP
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 32px",
            background: "#fff",
            color: "#f37021",
            border: "3px solid #f37021",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(243, 112, 33, 0.4)",
            transition: "all 0.3s ease",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow =
              "0 12px 32px rgba(243, 112, 33, 0.5)";
            e.currentTarget.style.background = "#f37021";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(243, 112, 33, 0.4)";
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#f37021";
          }}
        >
          <Plus size={24} />
          TẠO HỘI ĐỒNG MỚI
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            background: "linear-gradient(135deg, #FEE, #FCC)",
            border: "2px solid #C33",
            borderRadius: "12px",
            marginBottom: "32px",
            boxShadow: "0 4px 16px rgba(204, 51, 51, 0.2)",
          }}
        >
          <AlertCircle size={24} color="#C33" />
          <span style={{ color: "#C33", fontSize: "16px", fontWeight: "600" }}>
            {error}
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "80px",
            gap: "16px",
            background:
              "linear-gradient(135deg, rgba(243, 112, 33, 0.1) 0%, rgba(0, 40, 85, 0.1) 100%)",
            borderRadius: "16px",
            border: "2px solid #f37021",
          }}
        >
          <Loader
            size={32}
            color="#f37021"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span
            style={{ color: "#002855", fontSize: "18px", fontWeight: "600" }}
          >
            ĐANG TẢI DANH SÁCH HỘI ĐỒNG...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && committees.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "100px 40px",
            background:
              "linear-gradient(135deg, rgba(243, 112, 33, 0.05) 0%, rgba(0, 40, 85, 0.05) 100%)",
            borderRadius: "16px",
            border: "3px dashed #f37021",
          }}
        >
          <Shield
            size={80}
            color="#f37021"
            style={{ opacity: 0.5, marginBottom: "24px" }}
          />
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#002855",
              marginBottom: "12px",
            }}
          >
            CHƯA CÓ HỘI ĐỒNG NÀO
          </h3>
          <p style={{ color: "#666", marginBottom: "32px", fontSize: "16px" }}>
            BẮT ĐẦU BẰNG CÁCH TẠO HỘI ĐỒNG BẢO VỆ ĐẦU TIÊN
          </p>
          <button
            onClick={handleCreateNew}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 32px",
              background: "linear-gradient(135deg, #f37021 0%, #d85f1a 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(243, 112, 33, 0.4)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 32px rgba(243, 112, 33, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(243, 112, 33, 0.4)";
            }}
          >
            <Plus size={20} />
            TẠO HỘI ĐỒNG
          </button>
        </div>
      )}

      {/* Committee Grid */}
      {!loading && committees.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: "32px",
          }}
        >
          {committees.map((committee) => (
            <div
              key={committee.committeeCode}
              style={{
                background: "#fff",
                border: "3px solid #f37021",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 16px 48px rgba(243, 112, 33, 0.25)";
                e.currentTarget.style.borderColor = "#002855";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.borderColor = "#f37021";
              }}
              onClick={() => handleViewDetail(committee.committeeCode)}
            >
              {/* Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  padding: "6px 16px",
                  background: getStatusColor(committee.status),
                  color: "#fff",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                {committee.statusText}
              </div>

              {/* Committee Code */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    background:
                      "linear-gradient(135deg, rgba(243, 112, 33, 0.1) 0%, rgba(0, 40, 85, 0.1) 100%)",
                    color: "#f37021",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "2px solid #f37021",
                  }}
                >
                  {committee.committeeCode}
                </span>
              </div>

              {/* Committee Name */}
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "20px",
                  lineHeight: "1.4",
                }}
              >
                {committee.name}
              </h3>

              {/* Committee Details */}
              <div
                style={{ display: "grid", gap: "12px", marginBottom: "24px" }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Calendar size={18} color="#f37021" />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {new Date(committee.defenseDate).toLocaleDateString(
                      "vi-VN",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <MapPin size={18} color="#f37021" />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    Phòng {committee.room}
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Users size={18} color="#f37021" />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {committee.memberCount} thành viên
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <FileText size={18} color="#f37021" />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {committee.topicCount} đề tài
                  </span>
                </div>
              </div>

              {/* View Detail Button */}
              <button
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background:
                    "linear-gradient(135deg, #002855 0%, #001a3d 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #f37021 0%, #d85f1a 100%)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #002855 0%, #001a3d 100%)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <Eye size={16} />
                XEM CHI TIẾT
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CommitteeList;

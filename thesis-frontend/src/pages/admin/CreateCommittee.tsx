import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  Shield,
  Calendar,
  MapPin,
  FileText,
  Users,
  Plus,
  Info,
} from "lucide-react";

// Mock Data - Dữ liệu mẫu cho form tạo hội đồng
interface MockLecturer {
  lecturerCode: string;
  lecturerName: string;
  degree: string;
  department: string;
}

const mockLecturers: MockLecturer[] = [
  {
    lecturerCode: "GV001",
    lecturerName: "TS. Nguyễn Văn An",
    degree: "Tiến sĩ",
    department: "CNTT",
  },
  {
    lecturerCode: "GV002",
    lecturerName: "PGS.TS. Trần Thị Bình",
    degree: "Phó Giáo sư - Tiến sĩ",
    department: "CNTT",
  },
  {
    lecturerCode: "GV003",
    lecturerName: "TS. Lê Văn Cường",
    degree: "Tiến sĩ",
    department: "CNTT",
  },
  {
    lecturerCode: "GV004",
    lecturerName: "ThS. Phạm Thị Dung",
    degree: "Thạc sĩ",
    department: "CNTT",
  },
  {
    lecturerCode: "GV005",
    lecturerName: "ThS. Hoàng Văn Em",
    degree: "Thạc sĩ",
    department: "CNTT",
  },
  {
    lecturerCode: "GV006",
    lecturerName: "TS. Đỗ Thị Linh",
    degree: "Tiến sĩ",
    department: "HTTT",
  },
  {
    lecturerCode: "GV007",
    lecturerName: "PGS.TS. Bùi Văn Minh",
    degree: "Phó Giáo sư - Tiến sĩ",
    department: "KHDL",
  },
];

const CreateCommittee: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberSelection, setShowMemberSelection] = useState(false);

  const [formData, setFormData] = useState({
    committeeCode: "",
    name: "",
    defenseDate: "",
    room: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberToggle = (lecturerCode: string) => {
    setSelectedMembers((prev) =>
      prev.includes(lecturerCode)
        ? prev.filter((code) => code !== lecturerCode)
        : [...prev, lecturerCode]
    );
  };

  const generateCommitteeCode = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    setFormData((prev) => ({
      ...prev,
      committeeCode: `HD${year}${randomNum}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simulate API call
    setTimeout(() => {
      setSuccess(`TẠO HỘI ĐỒNG THÀNH CÔNG! MÃ: ${formData.committeeCode}`);
      setTimeout(() => {
        navigate(`/admin/committees/detail/${formData.committeeCode}`);
      }, 2000);
      setLoading(false);
    }, 2000);
  };

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1200px",
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
          <button
            onClick={() => navigate("/admin/committees")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.2)",
              color: "#fff",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "16px",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#f37021";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </button>

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
            TẠO HỘI ĐỒNG BẢO VỆ MỚI
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
            THIẾT LẬP HỘI ĐỒNG BẢO VỆ LUẬN VĂN TỐT NGHIỆP MỚI
          </p>
        </div>

        {/* Info Panel */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "12px",
            padding: "20px",
            maxWidth: "300px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <Info size={24} color="#fff" />
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#fff",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Hướng dẫn
            </span>
          </div>
          <ul
            style={{
              color: "#fff",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
              paddingLeft: "20px",
            }}
          >
            <li>Điền đầy đủ thông tin cơ bản</li>
            <li>Chọn thành viên hội đồng</li>
            <li>Phân công đề tài sau khi tạo</li>
          </ul>
        </div>
      </div>

      {/* Messages */}
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

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "20px",
            background: "linear-gradient(135deg, #EFE, #CFC)",
            border: "2px solid #3C3",
            borderRadius: "12px",
            marginBottom: "32px",
            boxShadow: "0 4px 16px rgba(51, 204, 51, 0.2)",
          }}
        >
          <CheckCircle size={24} color="#3C3" />
          <span style={{ color: "#3C3", fontSize: "16px", fontWeight: "600" }}>
            {success}
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "#fff",
            border: "3px solid #f37021",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#002855",
              marginBottom: "32px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <FileText size={28} color="#f37021" />
            THÔNG TIN CƠ BẢN
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
            }}
          >
            {/* Committee Code */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Mã Hội đồng <span style={{ color: "#f37021" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="text"
                  name="committeeCode"
                  value={formData.committeeCode}
                  onChange={handleChange}
                  required
                  placeholder="VD: HD2025001"
                  style={{
                    flex: 1,
                    padding: "16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    background: "#fafafa",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#f37021";
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(243, 112, 33, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={generateCommitteeCode}
                  style={{
                    padding: "16px 20px",
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
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, #002855 0%, #001a3d 100%)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Tự động tạo
                </button>
              </div>
            </div>

            {/* Room */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Phòng Bảo vệ
              </label>
              <div style={{ position: "relative" }}>
                <MapPin
                  size={20}
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#f37021",
                  }}
                />
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="VD: A101, B205, C301"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    background: "#fafafa",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#f37021";
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(243, 112, 33, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: "24px", gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Tên Hội đồng <span style={{ color: "#f37021" }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="VD: Hội đồng Bảo vệ Luận văn CNTT - Kỳ 2025.1"
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  background: "#fafafa",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#f37021";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(243, 112, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e0e0";
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Defense Date */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Ngày Bảo vệ
              </label>
              <div style={{ position: "relative" }}>
                <Calendar
                  size={20}
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#f37021",
                  }}
                />
                <input
                  type="date"
                  name="defenseDate"
                  value={formData.defenseDate}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                    background: "#fafafa",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#f37021";
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(243, 112, 33, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Mô tả (Tùy chọn)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về hội đồng bảo vệ..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                  background: "#fafafa",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#f37021";
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(243, 112, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e0e0";
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>

        {/* Member Selection Section */}
        <div
          style={{
            background: "#fff",
            border: "3px solid #002855",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "32px",
            }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#002855",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Users size={28} color="#002855" />
              CHỌN THÀNH VIÊN HỘI ĐỒNG
            </h2>
            <button
              type="button"
              onClick={() => setShowMemberSelection(!showMemberSelection)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: showMemberSelection ? "#f37021" : "#002855",
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
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(243, 112, 33, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Plus size={18} />
              {showMemberSelection ? "Ẩn danh sách" : "Chọn thành viên"}
            </button>
          </div>

          {showMemberSelection && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              {mockLecturers.map((lecturer) => (
                <div
                  key={lecturer.lecturerCode}
                  onClick={() => handleMemberToggle(lecturer.lecturerCode)}
                  style={{
                    padding: "20px",
                    border: selectedMembers.includes(lecturer.lecturerCode)
                      ? "3px solid #f37021"
                      : "2px solid #e0e0e0",
                    borderRadius: "12px",
                    background: selectedMembers.includes(lecturer.lecturerCode)
                      ? "linear-gradient(135deg, rgba(243, 112, 33, 0.05) 0%, rgba(0, 40, 85, 0.05) 100%)"
                      : "#fafafa",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(243, 112, 33, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {selectedMembers.includes(lecturer.lecturerCode) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#f37021",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircle size={16} color="#fff" />
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        background:
                          "linear-gradient(135deg, #f37021 0%, #d85f1a 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {lecturer.lecturerName.split(" ").pop()?.[0]}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#002855",
                          marginBottom: "4px",
                        }}
                      >
                        {lecturer.lecturerName}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          fontWeight: "500",
                        }}
                      >
                        {lecturer.lecturerCode}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "4px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#002855",
                        fontWeight: "600",
                      }}
                    >
                      Học vị: {lecturer.degree}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      Khoa: {lecturer.department}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedMembers.length > 0 && (
            <div
              style={{
                padding: "20px",
                background:
                  "linear-gradient(135deg, rgba(243, 112, 33, 0.1) 0%, rgba(0, 40, 85, 0.1) 100%)",
                border: "2px solid #f37021",
                borderRadius: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#002855",
                  marginBottom: "12px",
                }}
              >
                ĐÃ CHỌN {selectedMembers.length} THÀNH VIÊN:
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedMembers.map((code) => {
                  const lecturer = mockLecturers.find(
                    (l) => l.lecturerCode === code
                  );
                  return (
                    <span
                      key={code}
                      style={{
                        padding: "6px 12px",
                        background: "#f37021",
                        color: "#fff",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {lecturer?.lecturerName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            padding: "32px",
            background:
              "linear-gradient(135deg, rgba(0, 40, 85, 0.05) 0%, rgba(243, 112, 33, 0.05) 100%)",
            borderRadius: "12px",
            border: "2px solid #f37021",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin/committees")}
            disabled={loading}
            style={{
              padding: "16px 32px",
              background: "#fff",
              color: "#002855",
              border: "3px solid #002855",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 40, 85, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 32px",
              background: loading
                ? "#ccc"
                : "linear-gradient(135deg, #f37021 0%, #d85f1a 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading
                ? "none"
                : "0 6px 20px rgba(243, 112, 33, 0.4)",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 32px rgba(243, 112, 33, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(243, 112, 33, 0.4)";
            }}
          >
            {loading ? (
              <>
                <Loader
                  size={24}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                ĐANG TẠO HỘI ĐỒNG...
              </>
            ) : (
              <>
                <Save size={24} />
                TẠO HỘI ĐỒNG
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CreateCommittee;

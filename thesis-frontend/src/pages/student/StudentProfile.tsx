import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Edit,
  Save,
} from "lucide-react";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import type { StudentProfile } from "../../types/studentProfile";
import { useAuth } from "../../hooks/useAuth";

const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<StudentProfile>>(
    {}
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadStudentProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get student profile list
      const listRes = await fetchData(
        `/StudentProfiles/get-list?UserCode=${auth.user?.userCode}`
      );
      const listData = (listRes as ApiResponse<StudentProfile[]>)?.data || [];

      if (listData.length > 0) {
        const studentCode = listData[0].studentCode;

        // Get detailed profile
        const detailRes = await fetchData(
          `/StudentProfiles/get-update/${studentCode}`
        );
        const detailData = (detailRes as ApiResponse<StudentProfile>)?.data;

        if (detailData) {
          setProfile(detailData);
          setEditedProfile(detailData);
        } else {
          setProfile(listData[0]);
          setEditedProfile(listData[0]);
        }
      } else {
        setError("Không tìm thấy thông tin sinh viên");
      }
    } catch (err) {
      console.error("Error loading student profile:", err);
      setError("Có lỗi xảy ra khi tải thông tin sinh viên");
    } finally {
      setLoading(false);
    }
  }, [auth.user?.userCode]);

  useEffect(() => {
    if (auth.user?.userCode) {
      loadStudentProfile();
    }
  }, [loadStudentProfile, auth.user?.userCode]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      await fetchData(`/StudentProfiles/update/${profile.studentCode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedProfile),
      });

      setProfile({ ...profile, ...editedProfile });
      setIsEditing(false);
      // Reload to get updated data
      await loadStudentProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Có lỗi xảy ra khi cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
    setImagePreview(null);
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url) {
      setImagePreview(url);
      // Store the URL into the edited profile so the payload contains the image
      setEditedProfile({
        ...editedProfile,
        studentImage: url,
      });
    } else {
      // If no URL entered, clear preview
      setImagePreview(null);
    }
  };

  if (loading && !profile) {
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
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #E5E7EB",
            borderTop: "3px solid #4F46E5",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ color: "#374151", fontSize: "18px", fontWeight: "500" }}>
          ĐANG TẢI THÔNG TIN...
        </span>
      </div>
    );
  }

  if (error || !profile) {
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
          <div style={{ color: "#DC2626", fontSize: "20px" }}>⚠️</div>
          <span
            style={{ color: "#DC2626", fontSize: "16px", fontWeight: "500" }}
          >
            {error || "KHÔNG TÌM THẤY THÔNG TIN SINH VIÊN"}
          </span>
        </div>
        <button
          onClick={() => navigate("/student")}
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
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Page Title and Action Buttons */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate("/student")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
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

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#111827",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <User size={36} color="#6B7280" />
              THÔNG TIN SINH VIÊN
            </h1>
            <p
              style={{
                fontSize: "18px",
                color: "#6B7280",
                margin: 0,
                fontWeight: "400",
              }}
            >
              QUẢN LÝ THÔNG TIN CÁ NHÂN
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                background: isEditing ? "#10B981" : "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isEditing
                    ? "#059669"
                    : "#4338CA";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isEditing
                    ? "#10B981"
                    : "#4F46E5";
                }
              }}
            >
              {isEditing ? <Save size={16} /> : <Edit size={16} />}
              {isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
            </button>

            {isEditing && (
              <button
                onClick={handleCancel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "32px",
          marginBottom: "32px",
        }}
      >
        {/* Profile Image & Basic Info - Left Column */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid #E5E7EB",
            textAlign: "center",
            height: "fit-content",
          }}
        >
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              margin: "0 auto 24px",
              overflow: "hidden",
              border: "4px solid #E5E7EB",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            {imagePreview || profile.studentImage ? (
              <img
                src={imagePreview || profile.studentImage}
                alt={profile.fullName || auth.user?.fullName || "Student"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #F3F4F6, #E5E7EB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  color: "#6B7280",
                  fontWeight: "600",
                }}
              >
                {profile.fullName
                  ? profile.fullName.charAt(0)
                  : auth.user?.fullName
                  ? auth.user.fullName.charAt(0)
                  : "S"}
              </div>
            )}
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {profile.fullName || auth.user?.fullName || "Sinh viên"}
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#6B7280",
              marginBottom: "16px",
            }}
          >
            {profile.studentCode}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "8px 16px",
              marginBottom: "16px",
              background: profile.status === "Đang học" ? "#D1FAE5" : "#FEF3C7",
              color: profile.status === "Đang học" ? "#065F46" : "#92400E",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  profile.status === "Đang học" ? "#10B981" : "#F59E0B",
              }}
            />
            {profile.status}
          </div>

          {isEditing && (
            <div style={{ marginTop: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}
              >
                Đường dẫn ảnh đại diện
              </label>
              <input
                type="text"
                value={editedProfile.studentImage || ""}
                onChange={handleImageUrlChange}
                placeholder="Nhập URL ảnh..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#FFFFFF",
                  marginBottom: "8px",
                }}
              />
            </div>
          )}
        </div>

        {/* Personal Information - Right Column */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid #E5E7EB",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <User size={24} color="#6B7280" />
            Thông tin cá nhân
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "6px",
                }}
              >
                Giới tính
              </label>
              {isEditing ? (
                <select
                  value={editedProfile.gender || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      gender: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {profile.gender || "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "6px",
                }}
              >
                Ngày sinh
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={
                    editedProfile.dateOfBirth
                      ? new Date(editedProfile.dateOfBirth)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      dateOfBirth: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#FFFFFF",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Phone size={16} />
                Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.phoneNumber || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      phoneNumber: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#FFFFFF",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {profile.phoneNumber || "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Mail size={16} />
                Email sinh viên
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.studentEmail || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      studentEmail: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#FFFFFF",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {profile.studentEmail || "Chưa cập nhật"}
                </div>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#6B7280",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <MapPin size={16} />
                Địa chỉ
              </label>
              {isEditing ? (
                <textarea
                  value={editedProfile.address || ""}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      address: e.target.value,
                    })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#FFFFFF",
                    resize: "vertical",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "12px",
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {profile.address || "Chưa cập nhật"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information - Full Width Below */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid #E5E7EB",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <GraduationCap size={24} color="#6B7280" />
          Thông tin học tập
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Mã sinh viên
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
                fontWeight: "500",
              }}
            >
              {profile.studentCode}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Lớp
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              {profile.classCode}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Khoa
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              {profile.facultyCode}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Bộ môn
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              {profile.departmentCode}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar size={16} />
              Năm nhập học
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.enrollmentYear || ""}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    enrollmentYear: parseInt(e.target.value) || 0,
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#FFFFFF",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "12px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {profile.enrollmentYear}
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <GraduationCap size={16} />
              Năm tốt nghiệp
            </label>
            {isEditing ? (
              <input
                type="number"
                value={editedProfile.graduationYear || ""}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    graduationYear: parseInt(e.target.value) || 0,
                  })
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#FFFFFF",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "12px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {profile.graduationYear}
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              GPA
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
                fontWeight: "500",
              }}
            >
              {profile.gpa.toFixed(2)}
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Xếp loại học tập
            </label>
            <div
              style={{
                padding: "12px",
                background: "#F9FAFB",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#111827",
              }}
            >
              {profile.academicStanding}
            </div>
          </div>
        </div>

        {profile.notes && (
          <div style={{ marginTop: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: "6px",
              }}
            >
              Ghi chú
            </label>
            {isEditing ? (
              <textarea
                value={editedProfile.notes || ""}
                onChange={(e) =>
                  setEditedProfile({
                    ...editedProfile,
                    notes: e.target.value,
                  })
                }
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#FFFFFF",
                  resize: "vertical",
                }}
              />
            ) : (
              <div
                style={{
                  padding: "12px",
                  background: "#F9FAFB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#111827",
                }}
              >
                {profile.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfilePage;

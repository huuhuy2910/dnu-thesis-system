import React, { useEffect, useState } from "react";
import StudentNav from "../SideNavs/StudentNav";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, ChevronDown, User } from "lucide-react";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import type { StudentProfile } from "../../types/studentProfile";

const StudentLayout: React.FC = () => {
  const auth = useAuth();
  const [studentImage, setStudentImage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!auth.user?.userCode) return;
        const res = await fetchData(
          `/StudentProfiles/get-list?UserCode=${auth.user.userCode}`
        );
        const data = (res as ApiResponse<StudentProfile[]>)?.data || [];
        if (data.length > 0 && data[0].studentImage) {
          setStudentImage(data[0].studentImage as string);
        }
      } catch (err) {
        console.error("Error loading student profile image:", err);
      }
    };
    loadProfile();
  }, [auth.user?.userCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown]")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', 'Poppins', 'Roboto', sans-serif",
      }}
    >
      <aside
        style={{
          width: 260,
          backgroundColor: "#FFFFFF",
          color: "#002855",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #E5E7EB",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.05)",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 30,
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "24px 18px",
            background:
              "linear-gradient(180deg, rgba(243, 112, 33, 0.05) 0%, #FFFFFF 100%)",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <img
            src="/dnu_logo.png"
            alt="Đại học Đại Nam"
            style={{
              width: 88,
              display: "block",
              margin: "0 auto 10px",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))",
            }}
          />
          <h3
            style={{
              color: "#F37021",
              fontSize: 17,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            Hệ thống Quản lý Đồ án
          </h3>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            Vai trò: <strong style={{ color: "#F37021" }}>Sinh viên</strong>
          </div>
        </div>

        <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
          <StudentNav />
        </div>

        <footer
          style={{
            fontSize: 11,
            color: "#6B7280",
            textAlign: "center",
            padding: "18px 12px",
            borderTop: "1px solid #E5E7EB",
          }}
        >
          © 2025 Đại học Đại Nam
        </footer>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: 260,
        }}
      >
        <header
          style={{
            backgroundColor: "#FFFFFF",
            padding: "18px 36px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#002855",
            position: "fixed",
            left: 260,
            right: 0,
            top: 0,
            height: 72,
            zIndex: 20,
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#002855",
                letterSpacing: "0.5px",
              }}
            >
              Sinh viên Đại học Đại Nam
            </h2>
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                backgroundColor: "rgba(0, 123, 255, 0.1)",
                color: "#007BFF",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              Sinh viên
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }} data-dropdown>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  padding: "6px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(243, 112, 33, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {studentImage ? (
                  <img
                    src={studentImage}
                    alt={auth.user?.fullName || "avatar"}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "2px solid rgba(243, 112, 33, 0.1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #FFFFFF, rgba(243, 112, 33, 0.1))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      color: "#002855",
                      fontSize: "20px",
                      fontWeight: "600",
                    }}
                  >
                    {auth.user?.fullName ? auth.user.fullName.charAt(0) : "S"}
                  </div>
                )}
                <ChevronDown
                  size={16}
                  style={{
                    color: "#6B7280",
                    transition: "transform 0.2s",
                    transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                    minWidth: "200px",
                    zIndex: 1000,
                    marginTop: "8px",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {/* Avatar */}
                    {studentImage ? (
                      <img
                        src={studentImage}
                        alt={auth.user?.fullName || "avatar"}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          objectFit: "cover",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "2px solid rgba(243, 112, 33, 0.1)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #FFFFFF, rgba(243, 112, 33, 0.1))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          color: "#002855",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        {auth.user?.fullName
                          ? auth.user.fullName.charAt(0)
                          : "S"}
                      </div>
                    )}

                    {/* User Info */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "2px",
                        }}
                      >
                        {auth.user?.fullName || "Sinh viên"}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#6B7280",
                        }}
                      >
                        {auth.user?.userCode || ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "8px" }}>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        // Navigate to student profile page
                        window.location.href = "/student/profile";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "12px 16px",
                        background: "none",
                        border: "none",
                        borderRadius: "8px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#374151",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <User size={16} color="#6B7280" />
                      Thông tin sinh viên
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        auth.logout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        width: "100%",
                        padding: "12px 16px",
                        background: "none",
                        border: "none",
                        borderRadius: "8px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#DC2626",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FEF2F2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <LogOut size={16} color="#DC2626" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: "#FFFFFF",
            marginTop: 72,
            height: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;

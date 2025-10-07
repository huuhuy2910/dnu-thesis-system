import React, { useEffect, useState } from "react";
import StudentNav from "../SideNavs/StudentNav";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut } from "lucide-react";
import { fetchData } from "../../api/fetchData";
import type { ApiResponse } from "../../types/api";
import type { StudentProfile } from "../../types/student-profile";

const StudentLayout: React.FC = () => {
  const auth = useAuth();
  const [studentImage, setStudentImage] = useState<string | null>(null);

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
            background: "linear-gradient(180deg, rgba(243, 112, 33, 0.05) 0%, #FFFFFF 100%)",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                backgroundColor: "rgba(243, 112, 33, 0.05)",
                borderRadius: 12,
              }}
            >
              {studentImage ? (
                <img
                  src={studentImage}
                  alt={auth.user?.fullName || "avatar"}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "2px solid rgba(243, 112, 33, 0.1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #FFFFFF, rgba(243, 112, 33, 0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    color: "#002855",
                  }}
                >
                  {auth.user?.fullName ? auth.user.fullName.charAt(0) : "S"}
                </div>
              )}
              <div style={{ color: "#002855", fontWeight: 600 }}>
                {auth.user?.fullName || "Sinh viên"}
              </div>
            </div>

            <button
              onClick={() => auth.logout()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#F37021",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(243, 112, 33, 0.2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E55A1B";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(243, 112, 33, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F37021";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(243, 112, 33, 0.2)";
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
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

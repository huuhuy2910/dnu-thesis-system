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
        backgroundColor: "#FAFAFA",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          width: 260,
          backgroundColor: "#ffffff",
          color: "#333",
          display: "flex",
          flexDirection: "column",
          borderRight: "none",
          boxShadow: "4px 0 18px rgba(243,112,33,0.04)",
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
            background: "linear-gradient(180deg,#FFF8F3 0%,#fff 100%)",
            borderBottom: "1px solid #f6f2ef",
          }}
        >
          <img
            src="/dnu_logo.png"
            alt="Đại học Đại Nam"
            style={{
              width: 88,
              marginBottom: 10,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))",
            }}
          />
          <h3
            style={{
              color: "#f37021",
              fontSize: 17,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Hệ thống Quản lý Đồ án
          </h3>
          <div style={{ fontSize: 12, color: "#9a8a80", marginTop: 6 }}>
            Vai trò: <strong style={{ color: "#f37021" }}>Sinh viên</strong>
          </div>
        </div>

        <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
          <StudentNav />
        </div>

        <footer
          style={{
            fontSize: 11,
            color: "#999",
            textAlign: "center",
            padding: "18px 12px",
            borderTop: "1px solid #f0ebe8",
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
            background: "linear-gradient(135deg, #F37021 0%, #FF8838 100%)",
            padding: "18px 36px",
            boxShadow: "0 2px 12px rgba(243,112,33,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
            position: "fixed",
            left: 260,
            right: 0,
            top: 0,
            height: 72,
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Bảng điều khiển Sinh viên
            </h2>
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontWeight: 600,
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
                background: "rgba(255,255,255,0.12)",
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
                    border: "2px solid rgba(255,255,255,0.12)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#fff,#ffeede)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    color: "#333",
                  }}
                >
                  {auth.user?.fullName ? auth.user.fullName.charAt(0) : "S"}
                </div>
              )}
              <div style={{ color: "#fff", fontWeight: 600 }}>
                {auth.user?.fullName || "Sinh viên"}
              </div>
            </div>

            <button
              onClick={() => auth.logout()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.28)",
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#fff";
                (e.currentTarget as HTMLButtonElement).style.color = "#F37021";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
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
            backgroundColor: "#FAFAFA",
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

import React from "react";
import LecturerNav from "../SideNavs/LecturerNav";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut } from "lucide-react";

const LecturerLayout: React.FC = () => {
  const auth = useAuth();

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
          backgroundColor: "#F5F6FA",
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
            background: "linear-gradient(180deg, rgba(243, 112, 33, 0.08) 0%, #F5F6FA 100%)",
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
            Vai trò: <strong style={{ color: "#F37021" }}>Giảng viên</strong>
          </div>
        </div>

        <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
          <LecturerNav />
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
            backgroundColor: "#002855",
            padding: "18px 36px",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#FFFFFF",
            position: "fixed",
            left: 260,
            right: 0,
            top: 0,
            height: 72,
            zIndex: 20,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#FFFFFF",
                letterSpacing: "0.5px",
              }}
            >
              Bảng điều khiển Giảng viên
            </h2>
            <span
              style={{
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 8,
                backgroundColor: "rgba(243, 112, 33, 0.2)",
                color: "#F37021",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              Giảng viên
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 10px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(243, 112, 33, 0.1))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                👤
              </div>
              <div style={{ color: "#FFFFFF", fontWeight: 600 }}>
                {auth.user?.fullName || "Giảng viên"}
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
            backgroundColor: "#FFFFFF",
            padding: "24px 32px",
            marginTop: 72,
            height: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </div>

        <footer
          style={{
            backgroundColor: "#F5F6FA",
            borderTop: "1px solid #E5E7EB",
            padding: "16px 36px",
            textAlign: "center",
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          © 2025 Đại học Đại Nam
        </footer>
      </main>
    </div>
  );
};

export default LecturerLayout;

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
        backgroundColor: "#fff",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          width: 250,
          backgroundColor: "#fefefe",
          color: "#333",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #eee",
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px 16px" }}>
          <img
            src="/dnu_logo.png"
            alt="Đại học Đại Nam"
            style={{ width: 85, marginBottom: 12 }}
          />
          <h3
            style={{
              color: "#f37021",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Bảng điều khiển Giảng viên
          </h3>
          <div
            style={{
              backgroundColor: "#f37021",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              display: "inline-block",
              fontSize: 14,
            }}
          >
            👨‍🏫 {auth.user?.fullName || "Giảng viên"}
          </div>
        </div>

        <div style={{ flex: 1, padding: "8px 16px" }}>
          <LecturerNav />
        </div>

        <footer
          style={{
            fontSize: 12,
            color: "#888",
            textAlign: "center",
            padding: "16px 0",
            borderTop: "1px solid #eee",
          }}
        >
          © 2025 Đại học Đại Nam
        </footer>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            background: "linear-gradient(135deg, #f37021 0%, #f7931e 100%)",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 2px 8px rgba(243, 112, 33, 0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Bảng điều khiển Giảng viên
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>
              Xin chào, <strong>{auth.user?.fullName || "Giảng viên"}</strong>
            </div>
            <button
              onClick={() => auth.logout()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: 20, backgroundColor: "#fafafa" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LecturerLayout;

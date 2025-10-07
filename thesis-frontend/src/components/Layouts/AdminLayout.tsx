import React from "react";
import AdminNav from "../SideNavs/AdminNav";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, Bell } from "lucide-react";

const AdminLayout: React.FC = () => {
  const auth = useAuth();

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#FAFAFA", // light gray background per spec
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
            boxShadow: "4px 0 20px rgba(0,0,0,0.06)",
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
              padding: "28px 20px",
              background: "linear-gradient(180deg, #FFF8F3 0%, #ffffff 100%)",
              borderBottom: "1px solid #f5f5f5",
            }}
          >
            <img
              src="/dnu_logo.png"
              alt="Đại học Đại Nam"
              style={{
                width: 90,
                marginBottom: 14,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
            <h3
              style={{
                color: "#f37021",
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 4,
                letterSpacing: "-0.3px",
              }}
            >
              Quản trị hệ thống
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "#999",
                margin: 0,
                fontWeight: 500,
              }}
            >
              Đại học Đại Nam
            </p>
          </div>

          <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
            <AdminNav />
          </div>

          <footer
            style={{
              fontSize: 11,
              color: "#999",
              textAlign: "center",
              padding: "20px 16px",
              borderTop: "1px solid #f0f0f0",
              background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
              fontWeight: 500,
            }}
          >
            <div style={{ marginBottom: 4, fontSize: 10, color: "#bbb" }}>
              Phiên bản 1.0.0
            </div>
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
              padding: "12px 28px",
              borderBottom: "none",
              boxShadow: "0 2px 12px rgba(243, 112, 33, 0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#fff",
              position: "fixed",
              left: 260,
              right: 0,
              top: 0,
              height: 50,
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
                  letterSpacing: "-0.3px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                Quản trị hệ thống đồ án tốt nghiệp
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {/* Notification Icon with Badge */}
              <div
                style={{
                  position: "relative",
                  cursor: "pointer",
                  padding: "10px",
                  borderRadius: "10px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                title="Thông báo"
              >
                <Bell size={20} strokeWidth={2.5} />
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    backgroundColor: "#ff3d00",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "700",
                    border: "2px solid #F37021",
                    boxShadow: "0 2px 6px rgba(255, 61, 0, 0.4)",
                    animation: "pulse 2s infinite",
                  }}
                >
                  3
                </span>
              </div>

              {/* User Info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 14px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #fff 0%, #ffe0cc 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  👤
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {auth.user?.fullName || "Quản trị viên"}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => auth.logout()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.color = "#F37021";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                <LogOut size={17} strokeWidth={2.5} />
                Đăng xuất
              </button>
            </div>
          </header>

          <div
            style={{
              flex: 1,
              backgroundColor: "#FAFAFA",
              padding: "24px 32px",
              marginTop: 50,
              height: "calc(100vh - 50px)",
              overflowY: "auto",
            }}
          >
            <Outlet />
          </div>

          <footer
            style={{
              backgroundColor: "#fff",
              borderTop: "1px solid #f0f0f0",
              padding: "16px 36px",
              textAlign: "center",
              fontSize: "12px",
              color: "#888",
              fontWeight: 500,
              boxShadow: "0 -2px 10px rgba(0,0,0,0.03)",
            }}
          >
            © 2025 Đại học Đại Nam - Hệ thống quản lý đồ án tốt nghiệp
          </footer>
        </main>
      </div>
    </>
  );
};

export default AdminLayout;

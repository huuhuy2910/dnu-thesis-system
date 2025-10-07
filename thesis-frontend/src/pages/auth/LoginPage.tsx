import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  login as loginApi,
  parseLoginResponse,
} from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import { RolePaths } from "../../utils/role";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await loginApi({ username, password });
      if (!resp.success) {
        setError(resp.message ?? "Đăng nhập thất bại");
        setLoading(false);
        return;
      }
      const parsed = parseLoginResponse(resp);
      const user = parsed.user ?? null;

      // nếu server trả về user info
      if (user) {
        auth.login(user);
        const role = (user.role ?? "").toString().toUpperCase();
        const redirect = RolePaths[role] ?? "/";
        navigate(redirect);
        return;
      }

      // fallback: nếu server không trả user nhưng trả redirect url
      if (resp.redirectUrl) {
        window.location.href = resp.redirectUrl;
        return;
      }

      setError("Không nhận được thông tin user từ server.");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error?.response?.data?.message ?? error.message ?? "Lỗi kết nối"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', 'Poppins', 'Roboto', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background:
            "radial-gradient(circle, rgba(243, 112, 33, 0.03) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-30%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(0, 40, 85, 0.02) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      {/* Login Form */}
      <div
        className="login-form-container"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "16px",
          padding: "3rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div className="login-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              border: "2px solid #F37021",
              boxShadow: "0 8px 24px rgba(243, 112, 33, 0.15)",
            }}
          >
            <img
              className="login-logo"
              src="/dnu_logo.png"
              alt="DNU Logo"
              style={{
                width: "70px",
                height: "70px",
                objectFit: "contain",
              }}
            />
          </div>
          <h1
            style={{
              color: "#002855",
              margin: "0 0 0.5rem 0",
              fontSize: "1.8rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            Đăng nhập hệ thống
          </h1>
          <p
            style={{
              color: "#6B7280",
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 400,
            }}
          >
            Hệ thống Quản lý Đồ án Tốt nghiệp - Đại học Đại Nam
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#DC2626",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Username Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                color: "#002855",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              Tên đăng nhập
            </label>
            <div
              style={{
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: focusedField === "username" ? "rgba(243, 112, 33, 0.02)" : "#FFFFFF",
                border:
                  focusedField === "username"
                    ? "2px solid #F37021"
                    : "2px solid #E5E7EB",
                transition: "all 0.3s ease",
              }}
            >
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Nhập tên đăng nhập"
                autoComplete="off"
                className="login-input"
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#002855",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  fontWeight: 400,
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                color: "#002855",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                letterSpacing: "0.3px",
              }}
            >
              Mật khẩu
            </label>
            <div
              style={{
                position: "relative",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: focusedField === "password" ? "rgba(243, 112, 33, 0.02)" : "#FFFFFF",
                border:
                  focusedField === "password"
                    ? "2px solid #F37021"
                    : "2px solid #E5E7EB",
                transition: "all 0.3s ease",
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Nhập mật khẩu"
                autoComplete="off"
                className="login-input"
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#002855",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  fontWeight: 400,
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              backgroundColor: loading ? "#E5E7EB" : "#F37021",
              color: loading ? "#6B7280" : "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: loading
                ? "none"
                : "0 4px 12px rgba(243, 112, 33, 0.2)",
              transform: loading ? "none" : "translateY(0)",
              letterSpacing: "0.3px",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#E55A1B";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(243, 112, 33, 0.25)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#F37021";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(243, 112, 33, 0.2)";
              }
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(107, 114, 128, 0.3)",
                    borderTop: "2px solid #6B7280",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Đang đăng nhập...
              </>
            ) : (
              <>Đăng nhập</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              color: "#6B7280",
              margin: 0,
              fontSize: "0.85rem",
              fontWeight: 400,
            }}
          >
            © 2025 Đại học Đại Nam - Khoa Công nghệ Thông tin
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;

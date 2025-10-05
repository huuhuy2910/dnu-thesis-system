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
        background:
          "linear-gradient(135deg, #ffffff 0%, #fff8f3 50%, #ffe8d6 100%)",
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
            "radial-gradient(circle, rgba(255, 107, 53, 0.05) 0%, transparent 70%)",
          animation: "float 6s ease-in-out infinite",
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
            "radial-gradient(circle, rgba(247, 147, 30, 0.03) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      {/* Login Form */}
      <div
        style={{
          background: "white",
          border: "2px solid #ffe8d6",
          borderRadius: "24px",
          padding: "3rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 50px rgba(255, 107, 53, 0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(45deg, #ff6b35, #f7931e)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "2rem",
              boxShadow: "0 10px 30px rgba(255, 107, 53, 0.3)",
            }}
          >
            🔐
          </div>
          <h1
            style={{
              color: "#2d3748",
              margin: "0 0 0.5rem 0",
              fontSize: "2rem",
              fontWeight: "600",
              background: "linear-gradient(45deg, #ff6b35, #f7931e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Đăng nhập
          </h1>
          <p
            style={{
              color: "#4a5568",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              padding: "1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Username Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                color: "#2d3748",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                transition: "color 0.3s ease",
              }}
            >
              Tên đăng nhập
            </label>
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                background: focusedField === "username" ? "#fff8f3" : "white",
                border:
                  focusedField === "username"
                    ? "2px solid #ff6b35"
                    : "2px solid #e2e8f0",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "username" ? "#ff6b35" : "#a0aec0",
                  fontSize: "1.1rem",
                  transition: "color 0.3s ease",
                }}
              >
                👤
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Nhập tên đăng nhập"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 3rem",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#2d3748",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "2rem" }}>
            <label
              style={{
                display: "block",
                color: "white",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              Mật khẩu
            </label>
            <div
              style={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                background: focusedField === "password" ? "#fff8f3" : "white",
                border:
                  focusedField === "password"
                    ? "2px solid #ff6b35"
                    : "2px solid #e2e8f0",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "password" ? "#ff6b35" : "#a0aec0",
                  fontSize: "1.1rem",
                  transition: "color 0.3s ease",
                }}
              >
                🔒
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Nhập mật khẩu"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 3rem",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#2d3748",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "1rem",
              background: loading
                ? "rgba(156, 163, 175, 0.5)"
                : "linear-gradient(45deg, #ff6b35, #f7931e)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: loading
                ? "none"
                : "0 10px 30px rgba(255, 107, 53, 0.3)",
              transform: loading ? "none" : "translateY(0)",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 15px 40px rgba(255, 107, 53, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(255, 107, 53, 0.3)";
              }
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Đang đăng nhập...
              </>
            ) : (
              <>🚀 Đăng nhập</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              color: "#4a5568",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Hệ thống Quản lý Khóa luận © 2025
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
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

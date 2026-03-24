import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/useToast";
import { resetPassword } from "../../services/auth.service";
import { FetchDataError } from "../../api/fetchData";

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { addToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userCode = auth.user?.userCode ?? "";
  const roleUpper = String(auth.user?.role || "").toUpperCase();
  const backPath =
    roleUpper === "LECTURER" ? "/lecturer/profile" : "/student/profile";

  const validationMessage = useMemo(() => {
    if (!newPassword) return null;

    if (!userCode) {
      return "Không tìm thấy UserCode hiện tại.";
    }

    if (newPassword.trim().length < 8) {
      return "Mật khẩu mới cần tối thiểu 8 ký tự.";
    }

    if (newPassword.trim().toLowerCase() === userCode.trim().toLowerCase()) {
      return "Mật khẩu mới không được trùng với UserCode.";
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }

    return null;
  }, [confirmPassword, newPassword, userCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userCode) {
      setError("Không tìm thấy mã người dùng hiện tại.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await resetPassword({
        userCode,
        newPassword,
      });

      if (!response.success) {
        const message = response.message || "Đổi mật khẩu thất bại.";
        setError(message);
        addToast(message, "error");
        return;
      }

      const message =
        response.data?.message ||
        response.message ||
        "Đổi mật khẩu thành công.";
      setSuccessMessage(message);
      addToast(message, "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const fallback = "Không thể đổi mật khẩu lúc này.";

      if (err instanceof FetchDataError) {
        const serverData = err.data as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;
        const detailedMessage =
          serverData?.message ||
          Object.values(serverData?.errors || {})?.[0]?.[0] ||
          err.message ||
          fallback;
        setError(detailedMessage);
        addToast(detailedMessage, "error");
      } else if (err instanceof Error) {
        setError(err.message || fallback);
        addToast(err.message || fallback, "error");
      } else {
        setError(fallback);
        addToast(fallback, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 740,
        margin: "0 auto",
        padding: "24px 8px 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#1f2937",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Đổi mật khẩu
          </h1>
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>
            Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại.
          </p>
        </div>

        <button
          onClick={() => navigate(backPath)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#374151",
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            background:
              "linear-gradient(90deg, rgba(243,112,33,0.1), rgba(243,112,33,0.03))",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#b45309",
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={18} />
          Bảo mật tài khoản
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#374151",
                }}
              >
                UserCode
              </label>
              <input
                value={userCode}
                disabled
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "#f9fafb",
                  color: "#374151",
                  fontWeight: 600,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#374151",
                }}
              >
                Mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <KeyRound
                  size={16}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "12px 14px 12px 36px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "#374151",
                }}
              >
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "12px 14px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              color: "#6b7280",
              lineHeight: 1.7,
            }}
          >
            <div>- Mật khẩu tối thiểu 8 ký tự.</div>
            <div>
              - Mật khẩu mới không được trùng UserCode (không phân biệt hoa
              thường).
            </div>
          </div>

          {validationMessage && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 10,
                border: "1px solid #fde68a",
                background: "#fffbeb",
                color: "#92400e",
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {validationMessage}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 10,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginTop: 14,
                borderRadius: 10,
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {successMessage}
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="submit"
              disabled={
                submitting ||
                !newPassword ||
                !confirmPassword ||
                Boolean(validationMessage)
              }
              style={{
                border: "none",
                borderRadius: 10,
                padding: "12px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                cursor:
                  submitting ||
                  !newPassword ||
                  !confirmPassword ||
                  Boolean(validationMessage)
                    ? "not-allowed"
                    : "pointer",
                background:
                  submitting ||
                  !newPassword ||
                  !confirmPassword ||
                  Boolean(validationMessage)
                    ? "#d1d5db"
                    : "linear-gradient(135deg, #f37021, #ff8c42)",
                color: "#fff",
              }}
            >
              {submitting ? (
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : null}
              {submitting ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default ChangePasswordPage;

import React from "react";
import { Link } from "react-router-dom";

const Forbidden: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 28,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>403</h1>
        <p style={{ marginTop: 10, marginBottom: 20, color: "#475569" }}>
          Bạn không có quyền truy cập trang này.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            textDecoration: "none",
            background: "#f37021",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 14px",
            fontWeight: 600,
          }}
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;

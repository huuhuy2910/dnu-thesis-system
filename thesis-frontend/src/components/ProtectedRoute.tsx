import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  clearAuthSession,
  hasValidAccessToken,
  markSessionExpiredMessage,
} from "../services/auth-session.service";

interface Props {
  children: React.ReactElement;
  allowedRoles?: string[]; // nếu undefined => chỉ cần authenticated
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const auth = useAuth();
  const hasValidToken = hasValidAccessToken();

  if (!hasValidToken) {
    clearAuthSession();
    markSessionExpiredMessage(
      "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
    );
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = auth.user?.role ?? "";
    if (!allowedRoles.includes(role)) {
      return (
        <div style={{ padding: 20 }}>
          Unauthorized — bạn không có quyền truy cập.
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

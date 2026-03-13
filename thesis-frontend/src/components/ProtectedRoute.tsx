import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  clearAuthSession,
  hasValidAccessToken,
  markSessionExpiredMessage,
} from "../services/auth-session.service";
import { normalizeRole, RolePaths } from "../utils/role";

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
    const role = normalizeRole(auth.user?.role ?? "");
    const normalizedAllowedRoles = allowedRoles.map((item) =>
      normalizeRole(item),
    );
    if (!normalizedAllowedRoles.includes(role)) {
      const fallbackPath = RolePaths[role];
      if (fallbackPath) {
        return <Navigate to={fallbackPath} replace />;
      }
      return <Navigate to="/403" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

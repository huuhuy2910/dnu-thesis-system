import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface Props {
  children: React.ReactElement;
  allowedRoles?: string[]; // nếu undefined => chỉ cần authenticated
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
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

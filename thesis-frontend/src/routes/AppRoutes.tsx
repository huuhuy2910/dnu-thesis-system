// src/routes/AppRoutes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import LoginPage from "../pages/auth/LoginPage";
import StudentLayout from "../components/Layouts/StudentLayout";
import LecturerLayout from "../components/Layouts/LecturerLayout";
import AdminLayout from "../components/Layouts/AdminLayout";
import StudentDashboard from "../pages/student/Dashboard";
import LecturerDashboard from "../pages/lecturer/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";
import UsersManagement from "../pages/admin/UsersManagement";
import TopicsManagement from "../pages/admin/TopicsManagement";
import CommitteesManagement from "../pages/admin/CommitteesManagement";
import ProtectedRoute from "../components/ProtectedRoute";

/**
 * AppRoutes chứa tất cả route của ứng dụng.
 * Nếu thêm route mới, chỉ edit file này.
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* STUDENT */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        {/* thêm các route con của student ở đây */}
      </Route>

      {/* LECTURER */}
      <Route
        path="/lecturer/*"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LecturerDashboard />} />
        {/* thêm các route con của lecturer ở đây */}
      </Route>

      {/* ADMIN */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="topics" element={<TopicsManagement />} />
        <Route path="committees" element={<CommitteesManagement />} />
        {/* thêm các route con khác của admin ở đây */}
      </Route>

      {/* fallback: nếu không match => điều hướng về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

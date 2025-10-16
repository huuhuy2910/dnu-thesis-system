// src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import LoginPage from "../pages/auth/LoginPage";
import StudentLayout from "../components/Layouts/StudentLayout";
import LecturerLayout from "../components/Layouts/LecturerLayout";
import AdminLayout from "../components/Layouts/AdminLayout";
import StudentDashboard from "../pages/student/Dashboard";
import TopicRegistration from "../pages/student/TopicRegistration";
import Progress from "../pages/student/Progress";
import Reports from "../pages/student/Reports";
import Schedule from "../pages/student/Schedule";
import Notifications from "../pages/student/Notifications";
import LecturerDashboard from "../pages/lecturer/Dashboard";
import LecturerCommittees from "../pages/lecturer/LecturerCommittees";
import LecturerStudents from "../pages/lecturer/LecturerStudents";
import LecturerSchedule from "../pages/lecturer/LecturerSchedule";
import LecturerReports from "../pages/lecturer/LecturerReports";
import AdminDashboard from "../pages/admin/Dashboard";
import UsersManagement from "../pages/admin/UsersManagement";
import TopicsManagement from "../pages/admin/TopicsManagement";
import SystemConfig from "../pages/admin/SystemConfig";
import ProtectedRoute from "../components/ProtectedRoute";
import ScrollToTop from "../components/ScrollToTop";

import CreateNotification from "../pages/admin/CreateNotification";
import StudentDefenseInfo from "../pages/student/StudentDefenseInfo";
import StudentProfilePage from "../pages/student/StudentProfile";
import LecturerProfilePage from "../pages/lecturer/LecturerProfile";
import LecturerTopicReview from "../pages/admin/LecturerTopicReview";
import LecturerNotifications from "../pages/lecturer/Notifications";

// Lazy load heavy components for better performance
const CommitteeManagement = lazy(() => import("../pages/admin/committee/CommitteeManagement"));
const CommitteeCreationPage = lazy(() => import("../pages/admin/committee/CommitteeCreationPage"));

/**
 * AppRoutes chứa tất cả route của ứng dụng.
 * Nếu thêm route mới, chỉ edit file này.
 */
const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
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
          <Route path="topics" element={<TopicRegistration />} />
          <Route path="progress" element={<Progress />} />
          <Route path="reports" element={<Reports />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="defense-info" element={<StudentDefenseInfo />} />
          <Route path="profile" element={<StudentProfilePage />} />
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
          <Route path="students" element={<LecturerStudents />} />
          <Route path="schedule" element={<LecturerSchedule />} />
          <Route path="committees" element={<LecturerCommittees />} />
          <Route path="reports" element={<LecturerReports />} />
          <Route path="profile" element={<LecturerProfilePage />} />
          <Route path="notifications" element={<LecturerNotifications />} />
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
          <Route path="committees" element={<CommitteeManagement />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="topic-review" element={<LecturerTopicReview />} />
          <Route path="notifications/create" element={<CreateNotification />} />
          {/* thêm các route con khác của admin ở đây */}
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
  <Route path="committees" element={
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1F3C88]"></div></div>}>
      <CommitteeManagement />
    </Suspense>
  } />
        <Route path="committees/create" element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1F3C88]"></div></div>}>
            <CommitteeCreationPage />
          </Suspense>
        } />
        <Route
          path="defense-assignments"
          element={<Navigate to="/admin/committees" replace />}
        />
        <Route path="system-config" element={<SystemConfig />} />
        <Route path="notifications/create" element={<CreateNotification />} />
        {/* thêm các route con khác của admin ở đây */}
      </Route>

        {/* fallback: nếu không match => điều hướng về /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;

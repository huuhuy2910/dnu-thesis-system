import React from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCog,
  Home,
  Users,
  ClipboardList,
  BookOpen,
  FileCog,
  Bell,
  Activity,
  GraduationCap,
  Building2,
  ShieldCheck,
} from "lucide-react";
import "./SideNav.css";
import "./AdminNav.css";
import { useAuth } from "../../hooks/useAuth";
import {
  isManagementRole,
  normalizeRole,
  ROLE_ADMIN,
  ROLE_STUDENT_SERVICE,
} from "../../utils/role";
import { hasUserManagementPermission } from "../../utils/permissions";

interface AdminNavProps {
  onNavigate?: () => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ onNavigate }) => {
  const auth = useAuth();
  const role = normalizeRole(auth.user?.role);

  if (!isManagementRole(role)) {
    return null;
  }

  const basePath =
    role === ROLE_STUDENT_SERVICE ? "/student-service" : "/admin";

  const commonItems = [
    { path: `${basePath}`, label: "Trang chủ", icon: <Home size={18} /> },
    {
      path: `${basePath}/students`,
      label: "Quản lý sinh viên",
      icon: <Users size={18} />,
    },
    {
      path: `${basePath}/lecturers`,
      label: "Quản lý giảng viên",
      icon: <GraduationCap size={18} />,
    },
    {
      path: `${basePath}/departments`,
      label: "Quản lý khoa/bộ môn",
      icon: <Building2 size={18} />,
    },
    {
      path: `${basePath}/topics`,
      label: "Quản lý đề tài",
      icon: <ClipboardList size={18} />,
    },
  ];

  const roleCanSeeUsers = hasUserManagementPermission(role, "users:list");

  const adminOnlyItems = [
    {
      path: "/admin/committees",
      label: "Điều phối đợt bảo vệ",
      icon: <CalendarCog size={18} />,    },
    {      path: `${basePath}/topic-review`,
      label: "Duyệt đề tài",
      icon: <BookOpen size={18} />,
    },
    {
      path: `${basePath}/committees`,
      label: "Hội đồng & phân công",
      icon: <ShieldCheck size={18} />,
    },
    {
      path: `${basePath}/notifications/create`,
      label: "Tạo thông báo",
      icon: <Bell size={18} />,
    },
    {
      path: `${basePath}/system-config`,
      label: "Cấu hình hệ thống",
      icon: <FileCog size={18} />,
    },
    {
      path: `${basePath}/activity-logs`,
      label: "Lịch sử hoạt động",
      icon: <Activity size={18} />,
    },
    {
      path: `${basePath}/workflow-audits`,
      label: "Workflow Audit",
      icon: <Activity size={18} />,
    },
  ];

  const navItems = [
    ...commonItems,
    ...(roleCanSeeUsers
      ? [
          {
            path: `${basePath}/users`,
            label: "Quản lý người dùng",
            icon: <Users size={18} />,
          },
        ]
      : []),
    ...(role === ROLE_ADMIN ? adminOnlyItems : []),
  ];

  return (
    <nav className="sidenav admin-theme">
      <ul>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) => (isActive ? "active" : undefined)}
              onClick={onNavigate}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminNav;

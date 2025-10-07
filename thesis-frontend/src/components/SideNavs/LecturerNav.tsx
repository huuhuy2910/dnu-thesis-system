import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  Users,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import './SideNav.css';
import './LecturerNav.css';

const LecturerNav: React.FC = () => {
  const navItems = [
    { path: '/lecturer', label: 'Trang chủ', icon: <Home size={18} /> },
    { path: '/lecturer/students', label: 'Sinh viên hướng dẫn', icon: <Users size={18} /> },
    { path: '/lecturer/topics', label: 'Đề tài duyệt', icon: <ClipboardList size={18} /> },
  { path: '/lecturer/schedule', label: 'Lịch chấm bảo vệ', icon: <CalendarCheck size={18} /> },
  // Committees view for lecturer
  { path: '/lecturer/committees', label: 'Hội đồng của tôi', icon: <Users size={18} /> },
    { path: '/lecturer/reports', label: 'Nhận xét báo cáo', icon: <FileText size={18} /> },
  ];

  return (
    <nav className="sidenav lecturer-theme">
      <ul>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                isActive ? 'active' : undefined
              }
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

export default LecturerNav;

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  ClipboardList,
  FileCog,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import './SideNav.css';

const AdminNav: React.FC = () => {
  const navItems = [
    { path: '/admin', label: 'Trang chủ', icon: <Home size={18} /> },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: <Users size={18} /> },
    { path: '/admin/topics', label: 'Quản lý đề tài', icon: <ClipboardList size={18} /> },
    { path: '/admin/committees', label: 'Quản lý hội đồng', icon: <ShieldCheck size={18} /> },
    { path: '/admin/config', label: 'Cấu hình hệ thống', icon: <FileCog size={18} /> },
    { path: '/admin/settings', label: 'Cài đặt khác', icon: <Settings size={18} /> },
  ];

  return (
    <nav className="sidenav admin-theme">
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

export default AdminNav;

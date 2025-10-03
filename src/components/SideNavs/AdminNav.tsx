import React from 'react';
import { Link } from 'react-router-dom';

const AdminNav: React.FC = () => {
  return (
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/admin">Trang chủ</Link></li>
        <li><Link to="/admin/users">Quản lý người dùng</Link></li>
      </ul>
    </nav>
  );
};

export default AdminNav;

import React from 'react';
import { Link } from 'react-router-dom';

const LecturerNav: React.FC = () => {
  return (
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/lecturer">Trang chủ</Link></li>
        <li><Link to="/lecturer/catalogs">Kho đề tài</Link></li>
      </ul>
    </nav>
  );
};

export default LecturerNav;

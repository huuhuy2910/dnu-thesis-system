import React from 'react';
import { Link } from 'react-router-dom';

const StudentNav: React.FC = () => {
  return (
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/student">Trang chủ</Link></li>
        <li><Link to="/student/topics">Đề tài (mẫu)</Link></li>
      </ul>
    </nav>
  );
};

export default StudentNav;

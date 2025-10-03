import React from 'react';
import LecturerNav from '../SideNavs/LecturerNav';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LecturerLayout: React.FC = () => {
  const auth = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, borderRight: '1px solid #eee', padding: 12 }}>
        <h4>Lecturer</h4>
        <div style={{ marginBottom: 12 }}>{auth.user?.fullName}</div>
        <LecturerNav />
      </aside>
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default LecturerLayout;

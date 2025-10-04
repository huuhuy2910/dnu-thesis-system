import React from 'react';
import StudentNav from '../SideNavs/StudentNav';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const StudentLayout: React.FC = () => {
  const auth = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#fff',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 250,
          backgroundColor: '#ffffff',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #eee',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
          <img
            src="/dnu_logo.png"
            alt="Đại học Đại Nam"
            style={{ width: 90, marginBottom: 12 }}
          />
          <h3
            style={{
              color: '#f37021',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Hệ thống Quản lý Đồ án Tốt nghiệp
          </h3>
        </div>

        <div style={{ flex: 1, padding: '8px 16px' }}>
          <StudentNav />
        </div>

        <footer
          style={{
            fontSize: 12,
            color: '#888',
            textAlign: 'center',
            padding: '16px 0',
            borderTop: '1px solid #eee',
          }}
        >
          © 2025 Đại học Đại Nam
        </footer>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            backgroundColor: '#f8f8f8',
            padding: '12px 20px',
            borderBottom: '1px solid #ddd',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>
            Bảng điều khiển Sinh viên
          </h2>
          <div style={{ fontSize: 14, color: '#555' }}>
            Xin chào, <strong>{auth.user?.fullName || 'Sinh viên'}</strong>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: '#fafafa',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;

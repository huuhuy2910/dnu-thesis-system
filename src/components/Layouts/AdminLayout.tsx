import React from 'react';
import AdminNav from '../SideNavs/AdminNav';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const auth = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f4f4f4',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <aside
        style={{
          width: 250,
          backgroundColor: '#ffffff',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #ddd',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <img
            src="/dnu_logo.png"
            alt="Đại học Đại Nam"
            style={{ width: 85, marginBottom: 12 }}
          />
          <h3
            style={{
              color: '#f37021',
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Quản trị hệ thống
          </h3>
          <div
            style={{
              backgroundColor: '#f37021',
              color: '#fff',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'inline-block',
              fontSize: 14,
            }}
          >
            👤 {auth.user?.fullName || 'Quản trị viên'}
          </div>
        </div>

        <div style={{ flex: 1, padding: '8px 16px' }}>
          <AdminNav />
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

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            backgroundColor: '#fff',
            padding: '12px 20px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>Bảng điều khiển Quản trị viên</h2>
        </header>

        <div style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

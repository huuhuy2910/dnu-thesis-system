import React, { useState } from 'react';
import { Users, Search, Filter, UserPlus, Edit, Lock, Unlock } from 'lucide-react';
import '../admin/Dashboard.css';

interface User {
  id: string;
  code: string;
  fullName: string;
  department: string;
  role: string;
  status: 'active' | 'locked';
  statusText: string;
}

// Mock data - Dữ liệu mẫu người dùng
const mockUsers: User[] = [
  {
    id: '1',
    code: 'SV001',
    fullName: 'Nguyễn Văn A',
    department: 'Công nghệ thông tin',
    role: 'Sinh viên',
    status: 'active',
    statusText: 'Hoạt động'
  },
  {
    id: '2',
    code: 'SV002',
    fullName: 'Trần Thị B',
    department: 'Công nghệ thông tin',
    role: 'Sinh viên',
    status: 'active',
    statusText: 'Hoạt động'
  },
  {
    id: '3',
    code: 'GV001',
    fullName: 'TS. Trần Minh Hòa',
    department: 'Công nghệ thông tin',
    role: 'Giảng viên',
    status: 'active',
    statusText: 'Hoạt động'
  },
  {
    id: '4',
    code: 'GV002',
    fullName: 'ThS. Nguyễn Thu Hà',
    department: 'Hệ thống thông tin',
    role: 'Giảng viên',
    status: 'active',
    statusText: 'Hoạt động'
  },
  {
    id: '5',
    code: 'SV003',
    fullName: 'Lê Văn C',
    department: 'Công nghệ thông tin',
    role: 'Sinh viên',
    status: 'locked',
    statusText: 'Đã khóa'
  }
];

const UsersManagement: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>
          <Users size={32} style={{ marginRight: 12, color: '#f37021' }} />
          Quản lý người dùng
        </h1>
        <p>Quản lý tài khoản sinh viên và giảng viên trong hệ thống.</p>
      </div>

      {/* Toolbar */}
      <div style={{ 
        background: 'white', 
        padding: '20px 24px', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#666" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Sinh viên">Sinh viên</option>
            <option value="Giảng viên">Giảng viên</option>
          </select>
        </div>

        {/* Add User Button */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#f37021',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d85f1a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f37021'}
        >
          <UserPlus size={18} />
          Thêm người dùng
        </button>
      </div>

      {/* Users Table */}
      <div className="recent-topics-section">
        <table className="topics-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Họ và tên</th>
              <th>Khoa/Bộ môn</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.code}</strong></td>
                <td>{user.fullName}</td>
                <td>{user.department}</td>
                <td>
                  <span className={`status-badge ${user.role === 'Sinh viên' ? 'in-progress' : 'approved'}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status === 'active' ? 'approved' : 'pending'}`}>
                    {user.statusText}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1e88e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Chỉnh sửa"
                    >
                      <Edit size={14} />
                      Sửa
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: user.status === 'active' ? '#d32f2f' : '#2e7d32',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                    >
                      {user.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                      {user.status === 'active' ? 'Khóa' : 'Mở'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
          Hiển thị {filteredUsers.length} / {users.length} người dùng
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
